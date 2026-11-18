const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/machines - List all CNC workstations and live tool health
router.get("/", async (req, res) => {
  try {
    const machines = await db.getMachines();
    const alerts = await db.getAlerts();
    return res.json({ machines, active_alerts: alerts });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch machine states" });
  }
});

// GET /api/machines/:id - Single machine status
router.get("/:id", async (req, res) => {
  try {
    const machine = await db.getMachineById(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }
    return res.json(machine);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch machine" });
  }
});

module.exports = router;
