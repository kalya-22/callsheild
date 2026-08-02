import sys
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient


def fake_prediction_result(audio_path: Path) -> dict[str, object]:
    return {
        "audio_path": str(audio_path),
        "predicted_label": "ai_generated",
        "ai_probability": 0.9988,
        "risk_level": "high",
        "warning": True,
        "chunk_count": 1,
        "chunk_predictions": [
            {
                "chunk_id": "test_chunk0001",
                "start_time_seconds": 0.0,
                "end_time_seconds": 3.0,
                "predicted_label": "ai_generated",
                "ai_probability": 0.9988,
            }
        ],
    }


def main() -> None:
    client = TestClient(app)
    sample_path = PROJECT_ROOT / "ml" / "data" / "raw" / "ai_generated" / "ai_generated_gtts_spk0001_0001.mp3"

    print("Testing health endpoint...")
    health = client.get("/api/v1/health")
    print("Testing prediction upload with a mocked ML result...")
    with patch("app.services.prediction_service.predict_audio_file", fake_prediction_result):
        prediction = client.post(
            "/api/v1/predict",
            files={"file": (sample_path.name, sample_path.read_bytes(), "audio/mpeg")},
        )
    prediction_data = prediction.json()
    print("Testing history list...")
    history = client.get("/api/v1/history?limit=5")
    print("Testing history detail...")
    detail = client.get(f"/api/v1/history/{prediction_data['prediction_id']}")

    print("health:", health.status_code, health.json())
    print(
        "prediction:",
        prediction.status_code,
        prediction_data["prediction_id"],
        prediction_data["predicted_label"],
        prediction_data["risk_level"],
    )
    print("history:", history.status_code, len(history.json()))
    print("detail:", detail.status_code, detail.json()["prediction_id"])


if __name__ == "__main__":
    main()
