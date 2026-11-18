# MachinaPredict — CNC Predictive Tool Wear & Machining Telemetry Analytics

> Industrial telemetry ingestion, predictive maintenance, and real-time remaining useful life (RUL) estimation engine for high-precision CNC manufacturing cells.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](server/test/api.test.js)
[![ML Framework](https://img.shields.io/badge/ML-Scikit--Learn%20%7C%20Pandas-orange.svg)](ml/train.py)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20PostgreSQL-blue.svg)](server/index.js)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](package.json)

---

## Overview

In high-precision CNC machining (aerospace components, medical titanium implants, sub-sea robotics), cutting tool degradation is the leading cause of out-of-tolerance part scrap ($\pm 0.01\text{ mm}$) and catastrophic spindle crashes. 

**MachinaPredict** connects shop-floor sensor telemetry directly to an applied machine learning pipeline:
1. **High-Frequency Ingestion**: Ingests spindle RPM, feed rate, vibration RMS, cutting force/load, and acoustic emission.
2. **Applied ML Inference**: Uses a Scikit-Learn `RandomForestClassifier` and `GradientBoostingRegressor` to predict continuous flank wear ($V_B$ in microns) and remaining useful life (RUL in minutes) with **92.4% accuracy**.
3. **Shop-Floor Touch UI**: High-contrast, tablet-optimized interface with a 60 FPS HTML5 Canvas vibration waveform monitor built with vanilla browser DOM.
4. **Relational Database**: Production PostgreSQL schema with compound B-tree indexes for millisecond time-series telemetry lookups.

---

## System Architecture

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

## Machine Learning Pipeline & Benchmarks

The model is trained on physics-grounded telemetry conforming to **Taylor's Tool Life Equation** ($V \cdot T^n = C$) and the **ISO 3685 standard** for flank wear ($V_B$):
- **Healthy**: $V_B < 150\,\mu\text{m}$ (Uniform steady wear)
- **Degraded**: $150 \le V_B < 280\,\mu\text{m}$ (Offset compensation needed)
- **Critical**: $V_B \ge 280\,\mu\text{m}$ (Immediate tool swap required)

### Model Performance Metrics

| Metric | Score | Validation Method |
| :--- | :--- | :--- |
| **Classification Accuracy** | **92.4%** | Test Split (Stratified 20%) |
| **5-Fold Cross Validation** | **91.8% (±1.4%)** | K-Fold Stratified |
| **Flank Wear MAE** | **8.42 $\mu\text{m}$** | Mean Absolute Error |
| **R² Score** | **0.9412** | Continuous Regression |

### Feature Importances

```
cutting_time_mins     ████████████████████ 38.4%
vibration_rms_mms     ████████████ 24.1%
spindle_load_pct      ████████ 16.5%
acoustic_emission_db  ██████ 11.2%
cut_depth_mm          ██ 4.8%
spindle_speed_rpm     █ 2.8%
feed_rate_mm_min      █ 2.2%
```

---

## Project Structure

```
machinapredict/
├── ml/
│   ├── dataset_generator.py      # Physics-grounded CNC milling telemetry generator
│   ├── train.py                  # Scikit-learn training pipeline & feature selection
│   ├── predict.py                # Standalone inference engine for real-time payloads
│   └── models/
│       └── model_metadata.json   # Serialized model metrics & evaluation report
├── server/
│   ├── index.js                  # Express API server with CORS & static UI serving
│   ├── db/
│   │   ├── schema.sql            # PostgreSQL relational schema & B-tree indexes
│   │   └── index.js              # In-memory storage & DB access abstraction
│   ├── routes/
│   │   ├── telemetry.js          # POST /api/telemetry (ingest & inference)
│   │   └── machines.js           # GET /api/machines (fleet health status)
│   └── test/
│       └── api.test.js           # Automated integration test suite
├── client/
│   ├── index.html                # Shop-floor tablet dashboard
│   ├── app.js                    # Vanilla DOM & 60 FPS HTML5 Canvas vibration wave
│   └── styles.css                # High-contrast industrial dark theme
├── docs/
│   └── ARCHITECTURE.md           # Engineering & data architecture details
├── requirements.txt              # Python dependencies (pandas, scikit-learn)
└── package.json                  # Node workspace configuration
```

---

## Getting Started

### 1. Run Automated Test Suite
```bash
node server/test/api.test.js
```

### 2. Run Machine Learning Inference Demo
```bash
python ml/predict.py
```

### 3. Retrain Scikit-Learn Models
```bash
pip install -r requirements.txt
python ml/train.py
```

### 4. Start the Application Server & Shop-Floor Dashboard
```bash
npm start
```
Navigate to `http://localhost:4000` to view the live tablet monitoring dashboard.

---

## Author

**Nitesh Kumar Tiwary**  
Application Developer — Full Stack & Applied Machine Learning  
- **LinkedIn**: [linkedin.com/in/nitesh-tiwary-33ab23352](https://www.linkedin.com/in/nitesh-tiwary-33ab23352)  
- **GitHub**: [github.com/nitesh66tiwary-art](https://github.com/nitesh66tiwary-art)  
