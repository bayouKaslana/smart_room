const mqtt   = require("mqtt");
const db     = require("../config/db");
const decisionEngine = require("../utils/decisionEngine");
require("dotenv").config();

const client = mqtt.connect({
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: "mqtts",
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  rejectUnauthorized: false
});

client.on("connect", () => {
  console.log("MQTT Connected (HiveMQ) ✅");
  client.subscribe("room/+/data", () => {
    console.log("Subscribed!");
  });
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Data masuk:", data);

    // ==========================
    // Decision Making
    // TIDAK DIUBAH
    // ==========================
    const result = decisionEngine(data);
    console.log("Decision:", result);

    // ==========================
    // Simpan ke Database
    // TIDAK DIUBAH
    // ==========================
    await db.query(
      `INSERT INTO sensor_data
      (node_id, temperature, humidity, air_quality, motion, fan_intake, fan_exhaust, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.node_id,
        data.temperature,
        data.humidity,
        data.air_quality,
        data.motion,
        result.fan_intake,
        result.fan_exhaust,
        result.mode
      ]
    );

    // ==========================
    // Publish Control
    // TIDAK DIUBAH
    // ==========================
    client.publish(
      `room/${data.node_id}/control`,
      JSON.stringify(result)
    );

    // ==========================
    // Broadcast ke WebSocket (BARU)
    // Kirim data terbaru ke semua client dashboard
    // yang sedang terbuka
    // ==========================
    try {
      const { broadcast } = require("../server");
      broadcast({
        type       : "sensor_update",
        node_id    : data.node_id,
        temperature: data.temperature,
        humidity   : data.humidity,
        air_quality: data.air_quality,
        motion     : data.motion,
        fan_intake : result.fan_intake,
        fan_exhaust: result.fan_exhaust,
        mode       : result.mode,
        created_at : new Date().toISOString(),
      });
    } catch (wsErr) {
      // Jika broadcast gagal, tidak mengganggu proses utama
      console.log("WebSocket broadcast skip:", wsErr.message);
    }

  } catch (err) {
    console.log("Error processing MQTT:", err);
  }
});

module.exports = client;