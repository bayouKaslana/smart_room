const mqtt   = require("mqtt");
const db     = require("../config/db");
const decisionEngine = require("../utils/decisionEngine");
require("dotenv").config();

const client = mqtt.connect({
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: "mqtt",
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  rejectUnauthorized: false
});

client.on("connect", () => {
  console.log("MQTT Connected (HiveMQ) ✅");

  // Subscribe data sensor
  client.subscribe("room/+/data", () => {
    console.log("Subscribed to room/+/data ✅");
  });

  // Subscribe status Online/Offline (Last Will)
  client.subscribe("room/+/status", () => {
    console.log("Subscribed to room/+/status ✅");
  });
});

client.on("message", async (topic, message) => {
  try {

    // ==========================
    // Ekstrak node_id dan tipe topik
    // ==========================
    const topicParts = topic.split("/");
    const node_id    = topicParts[1];
    const topicType  = topicParts[2];

    // ==========================
    // Handle Status Online/Offline (Last Will)
    // ==========================
    if (topicType === "status") {
      const status = message.toString(); // "online" atau "offline"
      console.log(`Status ${node_id}: ${status}`);

      try {
        const { broadcast } = require("../server");
        broadcast({
          type   : "node_status",
          node_id: node_id,
          status : status,
        });
      } catch (wsErr) {
        console.log("WebSocket broadcast skip:", wsErr.message);
      }
      return; // Tidak perlu proses lebih lanjut
    }

    const data = JSON.parse(message.toString());

    // ==========================
    // Ekstrak node_id dari topik
    // "room/node1/data" → "node1"
    // Tidak perlu lagi dari payload JSON
    // ==========================
    data.node_id = node_id;

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
