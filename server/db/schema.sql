-- MachinaPredict: High-Precision CNC Manufacturing Telemetry & Maintenance Schema
-- Target Database: PostgreSQL 14+

-- 1. CNC Machine Stations
CREATE TABLE IF NOT EXISTS machines (
    machine_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    axis_count INT NOT NULL DEFAULT 3,
    max_spindle_rpm INT NOT NULL DEFAULT 24000,
    firmware_version VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, IDLE, MAINTENANCE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cutting Tools / Tool Magazine Inventory
CREATE TABLE IF NOT EXISTS tools (
    tool_id VARCHAR(50) PRIMARY KEY,
    machine_id VARCHAR(50) REFERENCES machines(machine_id) ON DELETE SET NULL,
    tool_type VARCHAR(50) NOT NULL,            -- e.g., 'End Mill', 'Ball Nose', 'Face Mill'
    material VARCHAR(50) NOT NULL,             -- e.g., 'Solid Carbide', 'TiAlN Coated'
    diameter_mm NUMERIC(6, 3) NOT NULL,
    flank_wear_limit_microns NUMERIC(6, 2) NOT NULL DEFAULT 300.0,
    cumulative_cutting_mins NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    current_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY',
    mounted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. High-Frequency Telemetry Ingestion Log
CREATE TABLE IF NOT EXISTS telemetry_logs (
    log_id BIGSERIAL PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL REFERENCES machines(machine_id),
    tool_id VARCHAR(50) NOT NULL REFERENCES tools(tool_id),
    spindle_speed_rpm NUMERIC(8, 1) NOT NULL,
    feed_rate_mm_min NUMERIC(8, 2) NOT NULL,
    cut_depth_mm NUMERIC(5, 2) NOT NULL,
    spindle_load_pct NUMERIC(5, 2) NOT NULL,
    vibration_rms_mms NUMERIC(6, 3) NOT NULL,
    acoustic_emission_db NUMERIC(6, 2) NOT NULL,
    cutting_time_mins NUMERIC(8, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimized B-Tree Indexes for Time-Series Analysis & Sub-Millisecond Filtering
CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time ON telemetry_logs (machine_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tool ON telemetry_logs (tool_id, recorded_at DESC);

-- 4. Scikit-Learn Model Prediction History & Remaining Useful Life (RUL)
CREATE TABLE IF NOT EXISTS wear_predictions (
    prediction_id BIGSERIAL PRIMARY KEY,
    tool_id VARCHAR(50) NOT NULL REFERENCES tools(tool_id),
    machine_id VARCHAR(50) NOT NULL REFERENCES machines(machine_id),
    predicted_flank_wear_microns NUMERIC(6, 2) NOT NULL,
    remaining_useful_life_mins NUMERIC(8, 2) NOT NULL,
    condition_code INT NOT NULL,              -- 0: Healthy, 1: Degraded, 2: Critical
    condition_label VARCHAR(30) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_tool ON wear_predictions (tool_id, created_at DESC);

-- 5. Shop-Floor Maintenance Alerts & Interventions
CREATE TABLE IF NOT EXISTS maintenance_alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL REFERENCES machines(machine_id),
    tool_id VARCHAR(50) NOT NULL REFERENCES tools(tool_id),
    severity VARCHAR(20) NOT NULL,             -- INFO, WARNING, CRITICAL
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_unack ON maintenance_alerts (is_acknowledged, severity);
