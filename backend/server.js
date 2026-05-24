const express = require("express");
const cors = require("cors");
const sensorRoutes = require("./routes/sensorRoutes");
require("./config/db");
require("./services/mqttService");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", sensorRoutes);

app.get("/", (req, res) => {
  res.send("Smart Room Backend Running 🚀");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
