import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.features.extract_audio_features import extract_dataset_features


if __name__ == "__main__":
    features = extract_dataset_features()
    print(features.groupby("label").size())
    print(features.head())

