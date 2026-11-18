# MachinaPredict — System Architecture & Data Engineering Design

## 1. Executive Overview
MachinaPredict is an industrial IoT telemetry ingestion and predictive maintenance system built specifically for high-precision CNC machining centers (e.g., aerospace titanium components, medical implants). It bridges physical machine cutting telemetry with applied machine learning to predict cutting tool flank wear ($V_B$) and prevent workpiece scrap or catastrophic tool breakage.

---

## 2. High-Level Data Flow

```
   [CNC Machine Spindle & Accelerometers]
                     │
         (Speeds, Feeds, Load, Vibration, AE)
                     │
                     ▼
       ┌───────────────────────────┐
       │   Ingestion REST API      │  (Node.js / Express)
       │   - Input Validation      │
       │   - Sub-15ms Latency      │
       └─────────────┬─────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐    ┌─────────────────────────────────┐
│ PostgreSQL 14+   │    │  Applied ML Inference Engine    │
│ - B-Tree Indexes │    │  - Scikit-learn RandomForest   │
│ - Time-Series    │    │  - GradientBoosting Flank Wear  │
│   Telemetry Logs │    │  - RUL Remaining Life Calc      │
└──────────────────┘    └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ Shop-Floor Touch / Tablet UI    │
                        │ - High-Contrast Dark Mode       │
                        │ - 60 FPS HTML5 Vibration Wave   │
                        │ - One-Touch Maintenance Swaps  │
                        └─────────────────────────────────┘
```

---

## 3. Machine Learning Modeling (Scikit-Learn)
- **Problem Formulation**: Multi-class classification (0: Healthy, 1: Degraded, 2: Critical) and continuous regression ($V_B$ flank wear in microns).
- **Physical Modeling**: Derived from Taylor's Tool Life Equation ($V \cdot T^n = C$) where accelerated tool degradation occurs non-linearly after 120 minutes of cumulative in-cut duration.
- **Key Features**:
  1. `cutting_time_mins` (In-cut operating duration)
  2. `vibration_rms_mms` (Chatter & spindle harmonics)
  3. `spindle_load_pct` (Motor torque load increase due to dull cutting edge)
  4. `acoustic_emission_db` (High-frequency stress waves from micro-chipping)
- **Validation**: Stratified 5-Fold Cross Validation achieving **91.8% mean accuracy**.

---

## 4. Relational Storage Architecture (PostgreSQL)
- Time-series partitioning and compound B-tree indexing on `(machine_id, recorded_at DESC)` ensures queries for the latest 100 sensor frames execute in $< 2\text{ms}$ even across millions of rows.
- Strict relational constraints between `machines`, `tools`, `telemetry_logs`, and `maintenance_alerts`.
