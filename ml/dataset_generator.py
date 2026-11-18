"""
MachinaPredict - Industrial CNC Telemetry & Tool Wear Dataset Generator
Generates realistic sensor data based on Taylor's Tool Life Equation
and ISO 3685 standard for flank wear (VB) degradation curves.
"""

import math
import random
import csv
import os

def generate_cnc_dataset(num_samples=1500, output_path="cnc_tool_wear_telemetry.csv"):
    random.seed(42)
    
    headers = [
        "sample_id",
        "machine_id",
        "tool_id",
        "spindle_speed_rpm",
        "feed_rate_mm_min",
        "cut_depth_mm",
        "spindle_load_pct",
        "vibration_rms_mms",
        "acoustic_emission_db",
        "cutting_time_mins",
        "flank_wear_microns",
        "tool_condition"  # 0: Healthy, 1: Degraded, 2: Critical
    ]
    
    rows = []
    
    # 5 different CNC machine cells and tool configurations
    machine_ids = ["CNC-MILL-01", "CNC-MILL-02", "CNC-MILL-03", "CNC-5AX-01", "CNC-5AX-02"]
    
    for i in range(1, num_samples + 1):
        machine_id = random.choice(machine_ids)
        tool_id = f"TL-{random.randint(101, 120)}"
        
        # Cutting parameters (Speeds & Feeds)
        spindle_speed = round(random.uniform(9000, 16000), 0)
        feed_rate = round(random.uniform(500, 1400), 1)
        cut_depth = round(random.uniform(0.3, 2.2), 2)
        
        # Tool in-cut cumulative operating time (0 to 180 minutes)
        cutting_time = round(random.uniform(2, 175), 1)
        
        # Physical tool wear progression: initial rapid break-in -> steady linear -> accelerated wear
        # Modeled after Taylor wear curve
        base_wear = 25.0 + (cutting_time * 1.35)
        if cutting_time > 120:
            # Accelerated thermal/frictional degradation
            base_wear += (cutting_time - 120) ** 1.6
            
        noise = random.gauss(0, 8.0)
        flank_wear = max(15.0, round(base_wear + noise, 1))
        
        # Physical effects on telemetry as tool wears out:
        # 1. Spindle motor load rises as cutting edge dulls
        spindle_load = round(30.0 + (cut_depth * 15.0) + (flank_wear * 0.12) + random.gauss(0, 3.0), 1)
        spindle_load = min(99.0, max(20.0, spindle_load))
        
        # 2. Vibration increases due to chatter and tool rubbing
        vibration = round(0.8 + (spindle_speed / 12000.0) * 0.5 + (flank_wear / 100.0) * 1.1 + random.gauss(0, 0.25), 2)
        vibration = max(0.5, vibration)
        
        # 3. Acoustic emission energy spikes from micro-chipping and friction
        acoustic_emission = round(38.0 + (flank_wear * 0.14) + (feed_rate / 1000.0) * 5.0 + random.gauss(0, 2.0), 1)
        
        # Assign classification labels per ISO 3685:
        # Healthy: VB < 150 microns
        # Degraded: 150 <= VB < 280 microns
        # Critical: VB >= 280 microns (immediate tool offset correction or swap required)
        if flank_wear < 150.0:
            tool_condition = 0  # Healthy
        elif flank_wear < 280.0:
            tool_condition = 1  # Degraded
        else:
            tool_condition = 2  # Critical
            
        rows.append([
            i,
            machine_id,
            tool_id,
            spindle_speed,
            feed_rate,
            cut_depth,
            spindle_load,
            vibration,
            acoustic_emission,
            cutting_time,
            flank_wear,
            tool_condition
        ])
        
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    print(f"[OK] Generated {num_samples} CNC telemetry samples -> {output_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(current_dir, "cnc_tool_wear_telemetry.csv")
    generate_cnc_dataset(output_path=output_csv)
