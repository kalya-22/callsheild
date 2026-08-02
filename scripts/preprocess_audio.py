import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.preprocessing.audio_preprocessor import preprocess_dataset


if __name__ == "__main__":
    processed = preprocess_dataset()
    print(processed[["sample_id", "label", "processed_path"]].head())

