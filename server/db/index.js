/**
 * Database access layer supporting both PostgreSQL and in-memory mock storage
 * for zero-dependency standalone demonstrations and local development.
 */

const inMemoryDb = {
  machines: [
    {
      machine_id: "CNC-MILL-01",
      name: "DMG MORI 3-Axis Vertical Mill",
      axis_count: 3,
      max_spindle_rpm: 15000,
      status: "ACTIVE",
      active_tool: "TL-101",
      tool_wear_microns: 42.5,
      condition: "Healthy",
      rul_mins: 178.0
    },
    {
      machine_id: "CNC-MILL-02",
      name: "Haas VF-2SS Super-Speed Mill",
      axis_count: 3,
      max_spindle_rpm: 12000,
      status: "ACTIVE",
      active_tool: "TL-108",
      tool_wear_microns: 260.3,
      condition: "Degraded",
      rul_mins: 27.4
    },
    {
      machine_id: "CNC-5AX-01",
      name: "Hermle C42 5-Axis Precision Machining Center",
      axis_count: 5,
      max_spindle_rpm: 18000,
      status: "ACTIVE",
      active_tool: "TL-204",
      tool_wear_microns: 305.8,
      condition: "Critical",
      rul_mins: 0.0
    }
  ],
  telemetryLogs: [],
  predictions: [],
  alerts: [
    {
      alert_id: 1,
      machine_id: "CNC-5AX-01",
      tool_id: "TL-204",
      severity: "CRITICAL",
      message: "Tool wear exceeded 300 microns threshold (305.8 μm). Immediate tool swap required to prevent workpiece scrap.",
      timestamp: new Date().toISOString()
    }
  ]
};

async function getMachines() {
  return inMemoryDb.machines;
}

async function getMachineById(id) {
  return inMemoryDb.machines.find((m) => m.machine_id === id) || null;
}

async function saveTelemetry(telemetry, prediction) {
  const record = {
    id: inMemoryDb.telemetryLogs.length + 1,
    ...telemetry,
    prediction,
    timestamp: new Date().toISOString()
  };
  inMemoryDb.telemetryLogs.push(record);

  // Update active machine state
  const machine = inMemoryDb.machines.find((m) => m.machine_id === telemetry.machine_id);
  if (machine) {
    machine.tool_wear_microns = prediction.predicted_flank_wear_microns;
    machine.condition = prediction.condition_label;
    machine.rul_mins = prediction.remaining_useful_life_mins;
  }

  // Trigger alert if condition is Degraded or Critical
  if (prediction.condition_code >= 1) {
    inMemoryDb.alerts.push({
      alert_id: inMemoryDb.alerts.length + 1,
      machine_id: telemetry.machine_id,
      tool_id: telemetry.tool_id,
      severity: prediction.condition_code === 2 ? "CRITICAL" : "WARNING",
      message: `Tool ${telemetry.tool_id} entered ${prediction.condition_label} state. Flank wear: ${prediction.predicted_flank_wear_microns} μm.`,
      timestamp: new Date().toISOString()
    });
  }

  return record;
}

async function getAlerts() {
  return inMemoryDb.alerts.slice(-10).reverse();
}

module.exports = {
  getMachines,
  getMachineById,
  saveTelemetry,
  getAlerts
};
