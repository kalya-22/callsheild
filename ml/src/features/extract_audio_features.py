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


def extract_features_from_audio_array(
    audio: np.ndarray,
    sr: int,
    config: FeatureExtractionConfig,
) -> dict[str, float]:
    """Extract comprehensive acoustic biometric & forensic feature vector."""
    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=config.n_mfcc,
        hop_length=config.hop_length,
    )
    mfcc_delta = librosa.feature.delta(mfcc)

    spectral_centroid = librosa.feature.spectral_centroid(
        y=audio,
        sr=sr,
        hop_length=config.hop_length,
    )[0]
    spectral_rolloff_85 = librosa.feature.spectral_rolloff(
        y=audio,
        sr=sr,
        roll_percent=0.85,
        hop_length=config.hop_length,
    )[0]
    spectral_rolloff_95 = librosa.feature.spectral_rolloff(
        y=audio,
        sr=sr,
        roll_percent=0.95,
        hop_length=config.hop_length,
    )[0]
    spectral_flatness = librosa.feature.spectral_flatness(
        y=audio,
        hop_length=config.hop_length,
    )[0]
    spectral_contrast = librosa.feature.spectral_contrast(
        y=audio,
        sr=sr,
        hop_length=config.hop_length,
    )

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

    voiced_f0 = f0[np.isfinite(f0) & (f0 > 0)]
    pitch_delta = np.diff(voiced_f0) if voiced_f0.size > 1 else np.array([0.0])
    pitch_curvature = np.diff(pitch_delta) if pitch_delta.size > 1 else np.array([0.0])

    low_mfcc = np.mean(np.abs(mfcc[1:5])) if mfcc.shape[0] >= 5 else 1.0
    high_mfcc = np.mean(np.abs(mfcc[8:13])) if mfcc.shape[0] >= 13 else 0.1
    high_low_mfcc_ratio = float(high_mfcc / (low_mfcc + 1e-6))

    features: dict[str, float] = {
        "pitch_mean": safe_mean(f0),
        "pitch_std": safe_std(f0),
        "pitch_delta_std": safe_std(pitch_delta),
        "pitch_curvature_std": safe_std(pitch_curvature),
        "jitter": estimate_jitter(f0),
        "shimmer": estimate_shimmer(rms),
        "spectral_centroid_mean": safe_mean(spectral_centroid),
        "spectral_centroid_std": safe_std(spectral_centroid),
        "spectral_rolloff_85_mean": safe_mean(spectral_rolloff_85),
        "spectral_rolloff_95_mean": safe_mean(spectral_rolloff_95),
        "spectral_flatness_mean": safe_mean(spectral_flatness),
        "spectral_flatness_std": safe_std(spectral_flatness),
        "spectral_contrast_mean": safe_mean(spectral_contrast),
        "spectral_contrast_std": safe_std(spectral_contrast),
        "zcr_mean": safe_mean(zcr),
        "zcr_std": safe_std(zcr),
        "rms_mean": safe_mean(rms),
        "rms_std": safe_std(rms),
        "high_low_mfcc_ratio": high_low_mfcc_ratio,
    }

    for index in range(config.n_mfcc):
        mfcc_values = mfcc[index]
        delta_values = mfcc_delta[index]
        feature_number = index + 1
        features[f"mfcc_{feature_number}_mean"] = safe_mean(mfcc_values)
        features[f"mfcc_{feature_number}_std"] = safe_std(mfcc_values)
        features[f"mfcc_delta_{feature_number}_mean"] = safe_mean(delta_values)

    return features


def extract_features_for_chunk(
    row: pd.Series,
    config: FeatureExtractionConfig,
) -> dict[str, object]:
    chunk_path = DATA_DIR / str(row["chunk_path"])
    audio, sr = librosa.load(chunk_path, sr=config.sample_rate, mono=True)
    numeric_features = extract_features_from_audio_array(audio, sr, config)

    result: dict[str, object] = {
        "chunk_id": row["chunk_id"],
        "parent_sample_id": row["parent_sample_id"],
        "label": row["label"],
        "chunk_path": row["chunk_path"],
        "duration_seconds": row["duration_seconds"],
        "sample_rate": sr,
    }
    result.update(numeric_features)
    return result


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
    print(f"Extracted forensic features for {len(result)} chunks")
    print(f"Features saved to {FEATURES_PATH}")
