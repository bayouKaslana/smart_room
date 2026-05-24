const mqtt = require("mqtt");
const db = require("../config/db");
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

    const data =
      JSON.parse(message.toString());

    console.log("Data masuk:", data);

    // ==========================
    // Decision Making
    // ==========================
    const result =
      decisionEngine(data);

    console.log("Decision:", result);

    // ==========================
    // Simpan ke Database
    // ==========================
    await db.query(

      `INSERT INTO sensor_data
      (
        node_id,
        temperature,
        humidity,
        air_quality,
        motion,
        fan_intake,
        fan_exhaust,
        mode
      )

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
    // ==========================
    const nodeId =
      data.node_id;

    client.publish(

      `room/${nodeId}/control`,
      JSON.stringify(result)
    );

  } catch (err) {

    console.log(
      "Error processing MQTT:",
      err
    );
  }
});
module.exports = client;