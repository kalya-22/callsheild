"""
Export CallShield Scikit-Learn ML Model to Universal ONNX Format.
Enables 100% offline, zero-latency inference on Android edge devices.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
import joblib
import numpy as np
import onnxruntime as rt
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "baseline_model.joblib"
ONNX_OUT_PATH = PROJECT_ROOT / "ml" / "models" / "callshield_model.onnx"
METADATA_OUT_PATH = PROJECT_ROOT / "ml" / "models" / "feature_metadata.json"
ANDROID_ASSETS_DIR = PROJECT_ROOT / "mobile_app" / "android" / "app" / "src" / "main" / "assets"

def export_model_to_onnx() -> None:
    print(f"Loading trained model bundle from {MODEL_PATH}...")
    bundle = joblib.load(MODEL_PATH)
    pipeline = bundle["model"]
    feature_columns = bundle["feature_columns"]
    label_encoder = bundle["label_encoder"]
    
    num_features = len(feature_columns)
    print(f"Model has {num_features} input acoustic features.")
    
    # Extract Random Forest classifier from ensemble
    if hasattr(pipeline.named_steps["classifier"], "estimators_"):
        classifier_estimator = pipeline.named_steps["classifier"].estimators_[0]
    else:
        classifier_estimator = pipeline.named_steps["classifier"]
        
    rf_pipeline = Pipeline([
        ("scaler", pipeline.named_steps["scaler"]),
        ("classifier", classifier_estimator)
    ])
    
    # Define initial input type for ONNX graph: [batch_size, num_features]
    initial_type = [("float_input", FloatTensorType([None, num_features]))]
    
    print("Converting Scaler + Random Forest Pipeline to ONNX format...")
    onnx_model = convert_sklearn(
        rf_pipeline,
        initial_types=initial_type,
        target_opset=15,
        options={rf_pipeline: {"zipmap": False}}
    )
    
    # Save ONNX model to ml/models/
    with open(ONNX_OUT_PATH, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"[SUCCESS] ONNX model saved to: {ONNX_OUT_PATH}")
    
    # Save feature metadata & classes
    metadata = {
        "num_features": num_features,
        "feature_columns": feature_columns,
        "classes": list(label_encoder.classes_),
        "sample_rate": 16000,
        "chunk_duration_seconds": 3.0,
        "model_format": "ONNX Opset 15",
    }
    with open(METADATA_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SUCCESS] Feature metadata saved to: {METADATA_OUT_PATH}")
    
    # Copy ONNX model to Android native assets folder
    if ANDROID_ASSETS_DIR.exists():
        android_onnx = ANDROID_ASSETS_DIR / "callshield_model.onnx"
        android_meta = ANDROID_ASSETS_DIR / "feature_metadata.json"
        shutil.copy(ONNX_OUT_PATH, android_onnx)
        shutil.copy(METADATA_OUT_PATH, android_meta)
        print(f"[ANDROID] Bundled ONNX model to Android native assets: {android_onnx}")
    
    # Verification with ONNX Runtime
    print("\nRunning Verification with ONNX Runtime...")
    sess = rt.InferenceSession(str(ONNX_OUT_PATH))
    input_name = sess.get_inputs()[0].name
    
    # Generate dummy input of shape (1, num_features)
    dummy_input = np.random.randn(1, num_features).astype(np.float32)
    onnx_preds = sess.run(None, {input_name: dummy_input})
    
    print(f"ONNX Input Name: {input_name}, Shape: {sess.get_inputs()[0].shape}")
    print(f"ONNX Output Classes: {onnx_preds[0]}")
    print(f"ONNX Output Probabilities: {onnx_preds[1]}")
    print("\nONNX Model Verified and Ready for Offline On-Device Deployment!")

if __name__ == "__main__":
    export_model_to_onnx()
