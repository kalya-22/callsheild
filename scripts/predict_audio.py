import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.inference.predict_audio import predict_audio_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict whether an audio file is AI-generated.")
    parser.add_argument("audio_path", help="Path to a WAV, FLAC, or MP3 audio file.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    result = predict_audio_file(args.audio_path)
    print(json.dumps(result, indent=2))

