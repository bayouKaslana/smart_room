// ==========================
// Script Simulasi ESP32
// Jalankan: node simulate.js
// ==========================
const mqtt = require("mqtt");
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
  console.log("✅ Simulator terhubung ke MQTT Broker");

  let count = 0;

  // Kirim data setiap 5 detik seperti ESP32 asli
  const interval = setInterval(() => {
    count++;

    // Simulasi Node 1 — node_id tidak dikirim di payload
    // node_id diambil dari topik MQTT oleh backend
    const node1 = {
      temperature: +(27 + Math.random() * 3).toFixed(2),
      humidity   : +(60 + Math.random() * 10).toFixed(2),
      air_quality: Math.floor(800 + Math.random() * 400),
      motion     : Math.random() > 0.5 ? 1 : 0,
    };

    // Simulasi Node 2 — node_id tidak dikirim di payload
    const node2 = {
      temperature: +(26 + Math.random() * 3).toFixed(2),
      humidity   : +(55 + Math.random() * 10).toFixed(2),
      air_quality: Math.floor(700 + Math.random() * 500),
      motion     : Math.random() > 0.5 ? 1 : 0,
    };

    client.publish("room/node1/data", JSON.stringify(node1));
    client.publish("room/node2/data", JSON.stringify(node2));

    console.log(`[${count}] Node1:`, node1);
    console.log(`[${count}] Node2:`, node2);

    // Stop setelah 20 kali pengiriman
    if (count >= 20) {
      clearInterval(interval);
      client.end();
      console.log("✅ Simulasi selesai (20 data terkirim)");
    }
  }, 5000);
});

client.on("error", (err) => {
  console.log("❌ MQTT Error:", err.message);
});
