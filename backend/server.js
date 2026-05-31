const express    = require("express");
const cors       = require("cors");
const http       = require("http");
const { WebSocketServer } = require("ws");

const sensorRoutes = require("./routes/sensorRoutes");
const db           = require("./config/db");
require("dotenv").config();

const app    = express();
const server = http.createServer(app); // Bungkus express dengan http server

// ==========================
// WebSocket Server
// ==========================
const wss = new WebSocketServer({ server });

// Simpan semua client yang terhubung
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`WebSocket client terhubung (total: ${clients.size})`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`WebSocket client terputus (total: ${clients.size})`);
  });

  ws.on("error", (err) => {
    console.log("WebSocket error:", err);
    clients.delete(ws);
  });
});

// ==========================
// Fungsi broadcast ke semua client
// Dipanggil dari mqttService setiap ada data baru
// ==========================
function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(payload);
    }
  }
}

// Export broadcast agar bisa dipakai di mqttService
app.locals.broadcast = broadcast;
module.exports.broadcast = broadcast;

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());
app.use("/api", sensorRoutes);

app.get("/", (req, res) => {
  res.send("Smart Room Backend Running 🚀");
});

// ==========================
// Jalankan server
// Gunakan server.listen bukan app.listen
// agar WebSocket dan HTTP pakai port yang sama
// ==========================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket ready on ws://localhost:${PORT}`);

  // Inisialisasi mqttService setelah server siap
  require("./services/mqttService");
});