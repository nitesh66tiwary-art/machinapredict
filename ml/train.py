"""
MachinaPredict - Machine Learning Training Pipeline
Trains a Scikit-Learn RandomForestClassifier and GradientBoostingRegressor
on high-speed CNC milling telemetry to classify tool condition and predict Remaining Useful Life (RUL).
"""

import os
import json
import sys

def train_pipeline(data_path="cnc_tool_wear_telemetry.csv", model_dir="models"):
    try:
        import pandas as pd
        import numpy as np
        from sklearn.model_selection import train_test_split, cross_val_score
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
        from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, r2_score
        import joblib
    except ImportError as e:
        print(f"[ERROR] Missing ML dependencies: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        sys.exit(1)
        
    print("=" * 65)
    print(" MACHINAPREDICT — INDUSTRIAL ML TRAINING PIPELINE")
    print("=" * 65)
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Running generator...")
        from dataset_generator import generate_cnc_dataset
        generate_cnc_dataset(output_path=data_path)
        
    print(f"1. Ingesting CNC telemetry from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df)} samples with columns: {list(df.columns)}")
    
    # Feature Selection based on Physical Cutting Telemetry
    feature_cols = [
        "spindle_speed_rpm",
        "feed_rate_mm_min",
        "cut_depth_mm",
        "spindle_load_pct",
        "vibration_rms_mms",
        "acoustic_emission_db",
        "cutting_time_mins"
    ]
    
    X = df[feature_cols]
    y_class = df["tool_condition"]        # 0: Healthy, 1: Degraded, 2: Critical
    y_reg = df["flank_wear_microns"]       # Continuous wear in microns
    
    # 80/20 Stratified Train-Test Split
    X_train, X_test, y_train_cls, y_test_cls = train_test_split(
        X, y_class, test_size=0.20, random_state=42, stratify=y_class
    )
    _, _, y_train_reg, y_test_reg = train_test_split(
        X, y_reg, test_size=0.20, random_state=42, stratify=y_class
    )
    
    print(f"2. Split dataset: {len(X_train)} training, {len(X_test)} validation")
    
    # -------------------------------------------------------------
    # Model 1: RandomForestClassifier for Discrete Wear Condition
    # -------------------------------------------------------------
    print("3. Training RandomForestClassifier (100 estimators)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X_train, y_train_cls)
    
    y_pred_cls = clf.predict(X_test)
    acc = accuracy_score(y_test_cls, y_pred_cls)
    cv_scores = cross_val_score(clf, X, y_class, cv=5)
    
    print(f"   Classification Accuracy: {acc * 100:.2f}%")
    print(f"   5-Fold Cross-Validation: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")
    
    # Feature Importances
    importances = dict(zip(feature_cols, [round(float(val), 4) for val in clf.feature_importances_]))
    print(f"   Feature Importances:")
    for feature, imp in sorted(importances.items(), key=lambda item: item[1], reverse=True):
        print(f"     - {feature.ljust(22)}: {imp * 100:.1f}%")
        
    # -------------------------------------------------------------
    # Model 2: GradientBoostingRegressor for Flank Wear (microns)
    # -------------------------------------------------------------
    print("\n4. Training GradientBoostingRegressor for Flank Wear (microns)...")
    reg = GradientBoostingRegressor(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42)
    reg.fit(X_train, y_train_reg)
    
    y_pred_reg = reg.predict(X_test)
    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    r2 = r2_score(y_test_reg, y_pred_reg)
    print(f"   Flank Wear MAE: {mae:.2f} microns (R² score: {r2:.4f})")
    
    # Export Models and Metadata
    os.makedirs(model_dir, exist_ok=True)
    clf_path = os.path.join(model_dir, "tool_wear_classifier.joblib")
    reg_path = os.path.join(model_dir, "flank_wear_regressor.joblib")
    meta_path = os.path.join(model_dir, "model_metadata.json")
    
    joblib.dump(clf, clf_path)
    joblib.dump(reg, reg_path)
    
    metadata = {
        "model_version": "v1.2.0",
        "algorithm": "RandomForestClassifier + GradientBoostingRegressor",
        "features": feature_cols,
        "classes": {0: "Healthy", 1: "Degraded", 2: "Critical"},
        "metrics": {
            "accuracy": round(float(acc), 4),
            "cv_mean_accuracy": round(float(cv_scores.mean()), 4),
            "flank_wear_mae_microns": round(float(mae), 2),
            "r2_score": round(float(r2), 4)
        },
        "feature_importances": importances
    }
    
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\n[OK] Models serialized to: {model_dir}/")
    print(f"     - Classifier: {clf_path}")
    print(f"     - Regressor:  {reg_path}")
    print(f"     - Metadata:   {meta_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, "cnc_tool_wear_telemetry.csv")
    model_folder = os.path.join(script_dir, "models")
    train_pipeline(data_path=csv_file, model_dir=model_folder)
