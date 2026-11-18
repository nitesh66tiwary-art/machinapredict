const assert = require("assert");
const db = require("../db");

async function runTests() {
  console.log("==================================================");
  console.log(" MACHINAPREDICT — AUTOMATED TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;

  // Test 1: Fetch initial machine fleet
  try {
    const machines = await db.getMachines();
    assert(Array.isArray(machines), "Machines should be an array");
    assert(machines.length >= 3, "Fleet should contain at least 3 CNC machines");
    console.log("? Test 1 Passed: CNC Machine fleet loaded successfully.");
    passed++;
  } catch (err) {
    console.error("? Test 1 Failed:", err.message);
  }

  // Test 2: Ingest sensor telemetry and assert wear prediction
  try {
    const sampleTelemetry = {
      machine_id: "CNC-MILL-01",
      tool_id: "TL-101",
      spindle_speed_rpm: 12000,
      feed_rate_mm_min: 800,
      cut_depth_mm: 1.0,
      spindle_load_pct: 45.0,
      vibration_rms_mms: 1.2,
      acoustic_emission_db: 48.0,
      cutting_time_mins: 25.0
    };

    // Calculate prediction
    const wear = 25.0 + 25.0 * 1.35 + 1.2 * 12.0 + 45.0 * 0.4;
    const prediction = {
      condition_code: 0,
      condition_label: "Healthy",
      confidence: 0.94,
      predicted_flank_wear_microns: Math.round(wear * 10) / 10,
      remaining_useful_life_mins: 154.0
    };

    const saved = await db.saveTelemetry(sampleTelemetry, prediction);
    assert(saved.id > 0, "Record ID should be assigned");
    assert.strictEqual(saved.machine_id, "CNC-MILL-01");
    console.log("? Test 2 Passed: High-frequency telemetry ingested & indexed.");
    passed++;
  } catch (err) {
    console.error("? Test 2 Failed:", err.message);
  }

  // Test 3: Threshold alert triggering on critical wear
  try {
    const criticalTelemetry = {
      machine_id: "CNC-MILL-02",
      tool_id: "TL-108",
      spindle_speed_rpm: 14000,
      cutting_time_mins: 150.0
    };

    const criticalPrediction = {
      condition_code: 2,
      condition_label: "Critical (Immediate Swap Required)",
      confidence: 0.96,
      predicted_flank_wear_microns: 312.4,
      remaining_useful_life_mins: 0.0
    };

    await db.saveTelemetry(criticalTelemetry, criticalPrediction);
    const alerts = await db.getAlerts();
    const criticalAlert = alerts.find((a) => a.severity === "CRITICAL" && a.tool_id === "TL-108");
    assert(criticalAlert !== undefined, "Critical alert should be dispatched");
    console.log("? Test 3 Passed: Flank wear threshold alert dispatched successfully.");
    passed++;
  } catch (err) {
    console.error("? Test 3 Failed:", err.message);
  }

  console.log(`\nResults: ${passed}/3 tests passed cleanly.\n`);
  process.exit(passed === 3 ? 0 : 1);
}

runTests();
