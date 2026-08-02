import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient


def main() -> None:
    client = TestClient(app)
    sample_path = PROJECT_ROOT / "ml" / "data" / "raw" / "ai_generated" / "ai_generated_gtts_spk0001_0001.mp3"

    print("Testing real ML prediction through FastAPI. This can take 20-60 seconds.")
    prediction = client.post(
        "/api/v1/predict",
        files={"file": (sample_path.name, sample_path.read_bytes(), "audio/mpeg")},
    )
    print("status:", prediction.status_code)
    print(prediction.json())


if __name__ == "__main__":
    main()

