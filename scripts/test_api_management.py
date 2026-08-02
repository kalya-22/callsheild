import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.services.history_service import save_prediction
from fastapi.testclient import TestClient


def seed_prediction() -> int:
    result = {
        "filename": "module11_demo.mp3",
        "predicted_label": "ai_generated",
        "ai_probability": 0.91,
        "risk_level": "high",
        "warning": True,
        "chunk_count": 1,
        "chunk_predictions": [
            {
                "chunk_id": "demo_chunk0001",
                "start_time_seconds": 0.0,
                "end_time_seconds": 3.0,
                "predicted_label": "ai_generated",
                "ai_probability": 0.91,
            }
        ],
    }
    return int(save_prediction(result)["prediction_id"])


def main() -> None:
    client = TestClient(app)

    prediction_id = seed_prediction()
    status = client.get("/api/v1/status")
    history_before_delete = client.get("/api/v1/history?limit=5")
    delete_one = client.delete(f"/api/v1/history/{prediction_id}")
    history_after_delete = client.get(f"/api/v1/history/{prediction_id}")
    clear_all = client.delete("/api/v1/history")

    print("status:", status.status_code, status.json()["status"])
    print("history before delete:", history_before_delete.status_code, len(history_before_delete.json()))
    print("delete one:", delete_one.status_code, delete_one.json()["deleted_count"])
    print("detail after delete:", history_after_delete.status_code)
    print("clear all:", clear_all.status_code, clear_all.json()["deleted_count"])


if __name__ == "__main__":
    main()

