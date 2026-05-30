const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// ==========================
// GET Latest Single Data
// ==========================
router.get("/latest", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM sensor_data
      ORDER BY id DESC
      LIMIT 1
    `);
    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// GET Latest All Node
// ==========================
router.get("/latest-all", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s1.*
      FROM sensor_data s1
      INNER JOIN (
        SELECT node_id, MAX(id) as max_id
        FROM sensor_data
        GROUP BY node_id
      ) s2 ON s1.id = s2.max_id
    `);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// GET History
// Menggunakan MAX(created_at) sebagai acuan waktu agar
// tidak bergantung pada timezone MySQL (NOW() bisa meleset).
//
// Query params:
//   - minutes : rentang waktu dalam menit (default 30)
//               contoh: ?minutes=30 | ?minutes=60 | ?minutes=1440
// ==========================
router.get("/history", async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 30;

    const [rows] = await db.query(`
      SELECT
        node_id,
        temperature,
        humidity,
        air_quality,
        created_at
      FROM sensor_data
      WHERE created_at >= (
        SELECT MAX(created_at) FROM sensor_data
      ) - INTERVAL ? MINUTE
      ORDER BY node_id ASC, created_at ASC
    `, [minutes]);

    // Kelompokkan per node_id agar frontend mudah pakai
    const grouped = {};
    for (const row of rows) {
      const key = `node_${row.node_id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        temperature : row.temperature,
        humidity    : row.humidity,
        air_quality : row.air_quality,
        time        : row.created_at,
      });
    }

    res.json(grouped);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});


// ==========================
// GET Stats Harian
// Menghitung rata-rata, min, max per node per hari
// Query params:
//   - date : tanggal format YYYY-MM-DD (default: tanggal data terbaru)
// ==========================
router.get("/stats", async (req, res) => {
  try {
    // Gunakan tanggal dari data terbaru jika tidak ada query param
    let date = req.query.date;
    if (!date) {
      const [[latest]] = await db.query(
        `SELECT DATE(MAX(created_at)) as latest_date FROM sensor_data`
      );
      date = latest.latest_date;
    }

    const [today] = await db.query(`
      SELECT
        node_id,
        ROUND(AVG(temperature), 2)  as avg_temp,
        ROUND(MIN(temperature), 2)  as min_temp,
        ROUND(MAX(temperature), 2)  as max_temp,
        ROUND(AVG(humidity), 2)     as avg_humidity,
        ROUND(MIN(humidity), 2)     as min_humidity,
        ROUND(MAX(humidity), 2)     as max_humidity,
        ROUND(AVG(air_quality), 0)  as avg_air,
        ROUND(MIN(air_quality), 0)  as min_air,
        ROUND(MAX(air_quality), 0)  as max_air,
        COUNT(*)                    as total_data
      FROM sensor_data
      WHERE DATE(created_at) = ?
      GROUP BY node_id
    `, [date]);

    // Ambil juga data hari sebelumnya untuk perbandingan
    const [yesterday] = await db.query(`
      SELECT
        node_id,
        ROUND(AVG(temperature), 2)  as avg_temp,
        ROUND(AVG(humidity), 2)     as avg_humidity,
        ROUND(AVG(air_quality), 0)  as avg_air
      FROM sensor_data
      WHERE DATE(created_at) = DATE(?) - INTERVAL 1 DAY
      GROUP BY node_id
    `, [date]);

    // Gabungkan data hari ini dan kemarin per node
    const result = today.map(t => {
      const y = yesterday.find(y => y.node_id === t.node_id) || null;
      return {
        node_id       : t.node_id,
        date          : date,
        total_data    : t.total_data,
        temperature   : {
          avg: t.avg_temp, min: t.min_temp, max: t.max_temp,
          prev_avg: y ? y.avg_temp : null,
        },
        humidity      : {
          avg: t.avg_humidity, min: t.min_humidity, max: t.max_humidity,
          prev_avg: y ? y.avg_humidity : null,
        },
        air_quality   : {
          avg: t.avg_air, min: t.min_air, max: t.max_air,
          prev_avg: y ? y.avg_air : null,
        },
      };
    });

    res.json({ date, nodes: result });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// GET Anomali
// Mendeteksi lonjakan nilai sensor yang tidak wajar
// dengan membandingkan setiap baris dengan baris sebelumnya
// per node, lalu mengambil N anomali terbaru.
//
// Kriteria anomali:
//   - Suhu      : naik/turun > 3°C dalam 1 interval (5 detik)
//   - Kelembapan: naik/turun > 10% dalam 1 interval
//   - Kualitas  : naik > 400 ADC dalam 1 interval
//
// Query params:
//   - limit : jumlah anomali yang dikembalikan (default 20)
// ==========================
router.get("/anomalies", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Ambil data dengan nilai sebelumnya menggunakan LAG()
    const [rows] = await db.query(`
      SELECT
        node_id,
        temperature,
        humidity,
        air_quality,
        created_at,
        LAG(temperature)  OVER (PARTITION BY node_id ORDER BY id) as prev_temp,
        LAG(humidity)     OVER (PARTITION BY node_id ORDER BY id) as prev_humidity,
        LAG(air_quality)  OVER (PARTITION BY node_id ORDER BY id) as prev_air
      FROM sensor_data
      ORDER BY id DESC
      LIMIT 2000
    `);

    const anomalies = [];

    for (const row of rows) {
      if (row.prev_temp === null) continue;

      const diffTemp  = Math.abs(row.temperature - row.prev_temp);
      const diffHumid = Math.abs(row.humidity    - row.prev_humidity);
      const diffAir   = row.air_quality - row.prev_air;

      if (diffTemp > 3) {
        anomalies.push({
          node_id   : row.node_id,
          type      : "temperature",
          label     : "Lonjakan Suhu",
          value     : row.temperature,
          prev_value: row.prev_temp,
          diff      : +(row.temperature - row.prev_temp).toFixed(2),
          time      : row.created_at,
        });
      }

      if (diffHumid > 10) {
        anomalies.push({
          node_id   : row.node_id,
          type      : "humidity",
          label     : "Lonjakan Kelembapan",
          value     : row.humidity,
          prev_value: row.prev_humidity,
          diff      : +(row.humidity - row.prev_humidity).toFixed(2),
          time      : row.created_at,
        });
      }

      if (diffAir > 400) {
        anomalies.push({
          node_id   : row.node_id,
          type      : "air_quality",
          label     : "Lonjakan Kualitas Udara",
          value     : row.air_quality,
          prev_value: row.prev_air,
          diff      : +(row.air_quality - row.prev_air).toFixed(0),
          time      : row.created_at,
        });
      }
    }

    // Urutkan berdasarkan waktu terbaru & batasi jumlah
    anomalies.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(anomalies.slice(0, limit));

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;