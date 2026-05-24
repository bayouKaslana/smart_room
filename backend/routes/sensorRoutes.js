const express = require("express");

const router = express.Router();

const db = require("../config/db");

// ==========================
// GET Latest Single Data
// ==========================
router.get("/latest",
async (req, res) => {

  try {

    const [rows] =
      await db.query(`

      SELECT *
      FROM sensor_data

      ORDER BY id DESC

      LIMIT 1
    `);

    res.json(rows[0]);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

// ==========================
// GET Latest All Node
// ==========================
router.get("/latest-all",
async (req, res) => {

  try {

    const [rows] =
      await db.query(`

      SELECT s1.*

      FROM sensor_data s1

      INNER JOIN (

        SELECT
        node_id,

        MAX(id) as max_id

        FROM sensor_data

        GROUP BY node_id

      ) s2

      ON s1.id = s2.max_id

    `);

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

module.exports = router;