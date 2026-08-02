import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.features.extract_audio_features import extract_dataset_features
from ml.src.preprocessing.audio_chunker import create_dataset_chunks
from ml.src.preprocessing.audio_preprocessor import preprocess_dataset
from ml.src.training.train_baseline_model import train_baseline_models


def main() -> None:
    print("Step 1/4: preprocessing raw audio...")
    processed = preprocess_dataset()
    print(processed.groupby("label").size())

    print("\nStep 2/4: creating 3 second overlapping chunks...")
    chunks = create_dataset_chunks()
    print(chunks.groupby("label").size())

    print("\nStep 3/4: extracting audio features...")
    features = extract_dataset_features()
    print(features.groupby("label").size())

    print("\nStep 4/4: training and evaluating models...")
    result = train_baseline_models()
    print(result["comparison"])
    print(f"\nBest model: {result['best_model_name']}")
    print(f"Saved model: {result['model_path']}")
    print(f"Saved training summary: {result['summary_path']}")


if __name__ == "__main__":
    main()
