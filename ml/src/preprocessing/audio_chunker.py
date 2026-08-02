from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import librosa
import pandas as pd
import soundfile as sf


@dataclass(frozen=True)
class ChunkingConfig:
    chunk_duration_seconds: float = 3.0
    hop_duration_seconds: float = 1.5
    min_chunk_duration_seconds: float = 1.0
    sample_rate: int = 16000


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "ml" / "data"
CHUNKS_DIR = DATA_DIR / "chunks"
PROCESSED_METADATA_PATH = DATA_DIR / "metadata_processed.csv"
CHUNKS_METADATA_PATH = DATA_DIR / "metadata_chunks.csv"


def create_chunks_for_sample(
    row: pd.Series,
    config: ChunkingConfig,
) -> list[dict[str, object]]:
    processed_path = DATA_DIR / str(row["processed_path"])
    label = str(row["label"])
    sample_id = str(row["sample_id"])
    output_dir = CHUNKS_DIR / label
    output_dir.mkdir(parents=True, exist_ok=True)

    audio, sr = librosa.load(processed_path, sr=config.sample_rate, mono=True)
    chunk_size = int(config.chunk_duration_seconds * sr)
    hop_size = int(config.hop_duration_seconds * sr)
    min_chunk_size = int(config.min_chunk_duration_seconds * sr)

    rows: list[dict[str, object]] = []
    chunk_index = 1

    if len(audio) <= chunk_size:
        starts = [0] if len(audio) >= min_chunk_size else []
    else:
        starts = list(range(0, len(audio) - chunk_size + 1, hop_size))
        last_start = len(audio) - chunk_size
        if starts and starts[-1] != last_start:
            starts.append(last_start)

    for start in starts:
        end = min(start + chunk_size, len(audio))
        chunk = audio[start:end]

        if len(chunk) < min_chunk_size:
            continue

        chunk_id = f"{sample_id}_chunk{chunk_index:04d}"
        chunk_filename = f"{chunk_id}.wav"
        chunk_path = output_dir / chunk_filename
        sf.write(chunk_path, chunk, sr, subtype="PCM_16")

        rows.append(
            {
                "chunk_id": chunk_id,
                "parent_sample_id": sample_id,
                "label": label,
                "chunk_filename": chunk_filename,
                "chunk_path": chunk_path.relative_to(DATA_DIR).as_posix(),
                "start_time_seconds": round(start / sr, 4),
                "end_time_seconds": round(end / sr, 4),
                "duration_seconds": round((end - start) / sr, 4),
                "sample_rate": sr,
                "split": row.get("split", ""),
                "notes": "",
            }
        )
        chunk_index += 1

    return rows


def create_dataset_chunks(config: ChunkingConfig | None = None) -> pd.DataFrame:
    config = config or ChunkingConfig()
    metadata = pd.read_csv(PROCESSED_METADATA_PATH)
    chunk_rows: list[dict[str, object]] = []

    for _, row in metadata.iterrows():
        chunk_rows.extend(create_chunks_for_sample(row, config))

    chunks_metadata = pd.DataFrame(chunk_rows)
    chunks_metadata.to_csv(CHUNKS_METADATA_PATH, index=False)
    return chunks_metadata


if __name__ == "__main__":
    result = create_dataset_chunks()
    print(f"Created {len(result)} audio chunks")
    print(f"Metadata saved to {CHUNKS_METADATA_PATH}")

