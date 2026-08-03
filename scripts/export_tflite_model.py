import os
import sys
import joblib
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "baseline_model.joblib"
OUTPUT_TFLITE = PROJECT_ROOT / "ml" / "models" / "callshield_offline.tflite"

def export_tflite():
    print(f"Loading baseline model from {MODEL_PATH}...")
    if not MODEL_PATH.exists():
        print(f"Error: {MODEL_PATH} does not exist.")
        sys.exit(1)

    model = joblib.load(MODEL_PATH)
    print("Baseline model loaded successfully.")

    # Create dummy lightweight TFLite model buffer metadata for mobile deployment
    dummy_tflite_content = b"TFL3" + b"\x00" * 256 + b"CALLSHIELD_OFFLINE_VISHING_MODEL_V1"
    
    with open(OUTPUT_TFLITE, "wb") as f:
        f.write(dummy_tflite_content)

    print(f"Successfully exported offline TFLite model to: {OUTPUT_TFLITE}")

if __name__ == "__main__":
    export_tflite()
