from __future__ import annotations

from pathlib import Path

from app.services.history_service import DATABASE_PATH, count_predictions, initialize_database


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "baseline_model.joblib"
FEATURES_PATH = PROJECT_ROOT / "ml" / "data" / "features" / "tabular" / "audio_features.csv"


def get_backend_status() -> dict[str, object]:
    initialize_database()

    model_ready = MODEL_PATH.exists()
    database_ready = DATABASE_PATH.exists()
    features_ready = FEATURES_PATH.exists()

    return {
        "service": "CallShield API",
        "status": "ready" if model_ready and database_ready else "degraded",
        "model_ready": model_ready,
        "database_ready": database_ready,
        "features_ready": features_ready,
        "prediction_count": count_predictions(),
        "model_path": str(MODEL_PATH.relative_to(PROJECT_ROOT)),
        "database_path": str(DATABASE_PATH.relative_to(PROJECT_ROOT)),
    }
