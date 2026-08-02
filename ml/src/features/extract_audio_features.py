from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import librosa
import numpy as np
import pandas as pd


@dataclass(frozen=True)
class FeatureExtractionConfig:
    sample_rate: int = 16000
    n_mfcc: int = 13
    frame_length: int = 2048
    hop_length: int = 512
    fmin: float = 50.0
    fmax: float = 500.0


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "ml" / "data"
CHUNKS_METADATA_PATH = DATA_DIR / "metadata_chunks.csv"
FEATURES_DIR = DATA_DIR / "features"
FEATURES_PATH = FEATURES_DIR / "tabular" / "audio_features.csv"
SUMMARY_PATH = FEATURES_DIR / "summaries" / "feature_summary_by_label.csv"


def safe_mean(values: np.ndarray) -> float:
    values = values[np.isfinite(values)]
    return float(np.mean(values)) if values.size else 0.0


def safe_std(values: np.ndarray) -> float:
    values = values[np.isfinite(values)]
    return float(np.std(values)) if values.size else 0.0


def estimate_jitter(f0: np.ndarray) -> float:
    voiced_f0 = f0[np.isfinite(f0) & (f0 > 0)]
    if voiced_f0.size < 3:
        return 0.0

    periods = 1.0 / voiced_f0
    period_diff = np.abs(np.diff(periods))
    mean_period = np.mean(periods)
    if mean_period == 0:
        return 0.0
    return float(np.mean(period_diff) / mean_period)


def estimate_shimmer(rms: np.ndarray) -> float:
    rms = rms[np.isfinite(rms) & (rms > 0)]
    if rms.size < 3:
        return 0.0

    amplitude_diff = np.abs(np.diff(rms))
    mean_amplitude = np.mean(rms)
    if mean_amplitude == 0:
        return 0.0
    return float(np.mean(amplitude_diff) / mean_amplitude)


def extract_features_for_chunk(
    row: pd.Series,
    config: FeatureExtractionConfig,
) -> dict[str, object]:
    chunk_path = DATA_DIR / str(row["chunk_path"])
    audio, sr = librosa.load(chunk_path, sr=config.sample_rate, mono=True)

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=config.n_mfcc,
        hop_length=config.hop_length,
    )
    spectral_centroid = librosa.feature.spectral_centroid(
        y=audio,
        sr=sr,
        hop_length=config.hop_length,
    )[0]
    zcr = librosa.feature.zero_crossing_rate(
        y=audio,
        frame_length=config.frame_length,
        hop_length=config.hop_length,
    )[0]
    rms = librosa.feature.rms(
        y=audio,
        frame_length=config.frame_length,
        hop_length=config.hop_length,
    )[0]
    f0 = librosa.yin(
        audio,
        fmin=config.fmin,
        fmax=config.fmax,
        sr=sr,
        frame_length=config.frame_length,
        hop_length=config.hop_length,
    )

    features: dict[str, object] = {
        "chunk_id": row["chunk_id"],
        "parent_sample_id": row["parent_sample_id"],
        "label": row["label"],
        "chunk_path": row["chunk_path"],
        "duration_seconds": row["duration_seconds"],
        "sample_rate": sr,
        "pitch_mean": safe_mean(f0),
        "pitch_std": safe_std(f0),
        "spectral_centroid_mean": safe_mean(spectral_centroid),
        "spectral_centroid_std": safe_std(spectral_centroid),
        "zcr_mean": safe_mean(zcr),
        "zcr_std": safe_std(zcr),
        "rms_mean": safe_mean(rms),
        "rms_std": safe_std(rms),
        "jitter": estimate_jitter(f0),
        "shimmer": estimate_shimmer(rms),
    }

    for index in range(config.n_mfcc):
        mfcc_values = mfcc[index]
        feature_number = index + 1
        features[f"mfcc_{feature_number}_mean"] = safe_mean(mfcc_values)
        features[f"mfcc_{feature_number}_std"] = safe_std(mfcc_values)

    return features


def extract_dataset_features(
    config: FeatureExtractionConfig | None = None,
) -> pd.DataFrame:
    config = config or FeatureExtractionConfig()
    FEATURES_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)

    chunks = pd.read_csv(CHUNKS_METADATA_PATH)
    feature_rows = [extract_features_for_chunk(row, config) for _, row in chunks.iterrows()]
    features = pd.DataFrame(feature_rows)
    features.to_csv(FEATURES_PATH, index=False)

    numeric_columns = features.select_dtypes(include=["number"]).columns
    summary = features.groupby("label")[numeric_columns].mean().reset_index()
    summary.to_csv(SUMMARY_PATH, index=False)
    return features


if __name__ == "__main__":
    result = extract_dataset_features()
    print(f"Extracted features for {len(result)} chunks")
    print(f"Features saved to {FEATURES_PATH}")
