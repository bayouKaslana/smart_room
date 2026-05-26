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

module.exports = router;