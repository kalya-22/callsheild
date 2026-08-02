from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import librosa
import numpy as np
import pandas as pd
import soundfile as sf


@dataclass(frozen=True)
class PreprocessingConfig:
    target_sample_rate: int = 16000
    top_db: int = 30
    output_subdir: str = "processed"


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "ml" / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
SAMPLES_METADATA_PATH = DATA_DIR / "metadata_samples.csv"
PROCESSED_METADATA_PATH = DATA_DIR / "metadata_processed.csv"


def load_audio(path: Path, sample_rate: int) -> tuple[np.ndarray, int]:
    audio, sr = librosa.load(path, sr=sample_rate, mono=True)
    return audio.astype(np.float32), sr


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    peak = np.max(np.abs(audio)) if audio.size else 0.0
    if peak == 0:
        return audio
    return (audio / peak * 0.95).astype(np.float32)


def trim_silence(audio: np.ndarray, top_db: int) -> np.ndarray:
    if audio.size == 0:
        return audio
    trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
    return trimmed.astype(np.float32)


def preprocess_sample(
    row: pd.Series,
    config: PreprocessingConfig,
) -> dict[str, object]:
    raw_path = DATA_DIR / str(row["raw_path"])
    label = str(row["label"])
    sample_id = str(row["sample_id"])
    output_dir = PROCESSED_DIR / label
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{sample_id}.wav"

    audio, sr = load_audio(raw_path, config.target_sample_rate)
    original_duration = len(audio) / sr if sr else 0.0
    processed = normalize_audio(trim_silence(audio, config.top_db))
    processed_duration = len(processed) / sr if sr else 0.0

    sf.write(output_path, processed, sr, subtype="PCM_16")

    metadata = row.to_dict()
    metadata.update(
        {
            "processed_filename": output_path.name,
            "processed_path": output_path.relative_to(DATA_DIR).as_posix(),
            "processed_sample_rate": sr,
            "original_duration_seconds": round(original_duration, 4),
            "processed_duration_seconds": round(processed_duration, 4),
            "preprocessing_status": "success",
        }
    )
    return metadata


def preprocess_dataset(config: PreprocessingConfig | None = None) -> pd.DataFrame:
    config = config or PreprocessingConfig()
    metadata = pd.read_csv(SAMPLES_METADATA_PATH)
    processed_rows: list[dict[str, object]] = []

    for _, row in metadata.iterrows():
        processed_rows.append(preprocess_sample(row, config))

    processed_metadata = pd.DataFrame(processed_rows)
    processed_metadata.to_csv(PROCESSED_METADATA_PATH, index=False)
    return processed_metadata


if __name__ == "__main__":
    result = preprocess_dataset()
    print(f"Preprocessed {len(result)} audio files")
    print(f"Metadata saved to {PROCESSED_METADATA_PATH}")

