import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.training.train_baseline_model import train_baseline_models


if __name__ == "__main__":
    result = train_baseline_models()
    print(result["comparison"])

