from __future__ import annotations

from pathlib import Path

from app.services.history_service import count_predictions, initialize_database


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "baseline_model.joblib"
FEATURES_PATH = PROJECT_ROOT / "ml" / "data" / "features" / "tabular" / "audio_features.csv"


def get_backend_status() -> dict[str, object]:
    initialize_database()

    model_ready = MODEL_PATH.exists()
    features_ready = FEATURES_PATH.exists()
    
    try:
        pred_count = count_predictions()
        database_ready = True
    except Exception:
        pred_count = 0
        database_ready = False

    return {
        "service": "CallShield API",
        "status": "ready" if model_ready else "degraded",
        "model_ready": model_ready,
        "database_ready": database_ready,
        "features_ready": features_ready,
        "prediction_count": pred_count,
        "model_path": str(MODEL_PATH.relative_to(PROJECT_ROOT)) if model_ready else "models/baseline_model.joblib",
        "database_backend": "Supabase Cloud Database",
    }
