import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.preprocessing.audio_chunker import create_dataset_chunks


if __name__ == "__main__":
    chunks = create_dataset_chunks()
    print(chunks.groupby("label").size())
    print(chunks[["chunk_id", "label", "chunk_path"]].head())

