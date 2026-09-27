from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path

import joblib
import librosa
import numpy as np
import pandas as pd
import soundfile as sf

from ml.src.features.extract_audio_features import (
    FeatureExtractionConfig,
    extract_features_for_chunk,
)
from ml.src.preprocessing.audio_chunker import ChunkingConfig
from ml.src.preprocessing.audio_preprocessor import normalize_audio, trim_silence


@dataclass(frozen=True)
class PredictionConfig:
    sample_rate: int = 16000
    top_db: int = 30
    chunk_duration_seconds: float = 3.0
    hop_duration_seconds: float = 1.5
    min_chunk_duration_seconds: float = 0.3
    ai_label: str = "ai_generated"
    ai_chunk_threshold: float = 0.5
    warning_threshold: float = 0.55
    live_ai_chunk_threshold: float = 0.75
    live_warning_threshold: float = 0.7
    min_live_rms: float = 0.0001


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "baseline_model.joblib"


def preprocess_audio_file(audio_path: Path, config: PredictionConfig) -> tuple[np.ndarray, int]:
    audio, sr = librosa.load(audio_path, sr=config.sample_rate, mono=True)
    processed = normalize_audio(trim_silence(audio.astype(np.float32), config.top_db))
    return processed, sr


def create_inference_chunks(
    audio: np.ndarray,
    sr: int,
    config: PredictionConfig,
) -> list[tuple[np.ndarray, float, float]]:
    chunk_size = int(config.chunk_duration_seconds * sr)
    hop_size = int(config.hop_duration_seconds * sr)
    min_chunk_size = int(config.min_chunk_duration_seconds * sr)

    if len(audio) < min_chunk_size:
        return []

    if len(audio) <= chunk_size:
        starts = [0]
    else:
        starts = list(range(0, len(audio) - chunk_size + 1, hop_size))
        last_start = len(audio) - chunk_size
        if starts[-1] != last_start:
            starts.append(last_start)

    chunks: list[tuple[np.ndarray, float, float]] = []
    for start in starts:
        end = min(start + chunk_size, len(audio))
        chunk = audio[start:end]
        if len(chunk) >= min_chunk_size:
            chunks.append((chunk, start / sr, end / sr))
    return chunks


def extract_inference_features(
    chunks: list[tuple[np.ndarray, float, float]],
    sr: int,
) -> pd.DataFrame:
    feature_rows: list[dict[str, object]] = []
    feature_config = FeatureExtractionConfig(sample_rate=sr)

    with tempfile.TemporaryDirectory(prefix="callshield_inference_") as temp_dir:
        temp_path = Path(temp_dir)
        for index, (chunk, start_time, end_time) in enumerate(chunks, start=1):
            chunk_id = f"inference_chunk{index:04d}"
            chunk_path = temp_path / f"{chunk_id}.wav"
            sf.write(chunk_path, chunk, sr, subtype="PCM_16")

            row = pd.Series(
                {
                    "chunk_id": chunk_id,
                    "parent_sample_id": "inference_sample",
                    "label": "unknown",
                    "chunk_path": str(chunk_path),
                    "duration_seconds": round(end_time - start_time, 4),
                }
            )

            features = extract_features_for_chunk_from_absolute_path(
                row,
                feature_config,
            )
            features["start_time_seconds"] = round(start_time, 4)
            features["end_time_seconds"] = round(end_time, 4)
            feature_rows.append(features)

    return pd.DataFrame(feature_rows)


def extract_single_chunk_features(
    chunk: np.ndarray,
    sr: int,
    chunk_id: str = "live_chunk",
) -> pd.DataFrame:
    return extract_inference_features(
        [(chunk, 0.0, len(chunk) / sr)],
        sr,
    ).assign(chunk_id=chunk_id)


def extract_features_for_chunk_from_absolute_path(
    row: pd.Series,
    config: FeatureExtractionConfig,
) -> dict[str, object]:
    chunk_path = Path(str(row["chunk_path"]))
    audio, sr = librosa.load(chunk_path, sr=config.sample_rate, mono=True)

    from ml.src.features.extract_audio_features import extract_features_from_audio_array
    numeric_features = extract_features_from_audio_array(audio, sr, config)

    features: dict[str, object] = {
        "chunk_id": row["chunk_id"],
        "parent_sample_id": row["parent_sample_id"],
        "label": row["label"],
        "chunk_path": row["chunk_path"],
        "duration_seconds": row["duration_seconds"],
        "sample_rate": sr,
    }
    features.update(numeric_features)
    return features


def predict_audio_file(
    audio_path: str | Path,
    config: PredictionConfig | None = None,
) -> dict[str, object]:
    config = config or PredictionConfig()
    audio_path = Path(audio_path)
    model_bundle = joblib.load(MODEL_PATH)
    model = model_bundle["model"]
    feature_columns = model_bundle["feature_columns"]
    label_encoder = model_bundle["label_encoder"]

    audio, sr = preprocess_audio_file(audio_path, config)
    chunks = create_inference_chunks(audio, sr, config)
    if not chunks:
        raise ValueError("Audio is too short after preprocessing to create a prediction chunk.")

    features = extract_inference_features(chunks, sr)
    x = features[feature_columns]
    predictions = model.predict(x)
    labels = label_encoder.inverse_transform(predictions)

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(x)
        ai_index = int(label_encoder.transform([config.ai_label])[0])
        ai_scores = probabilities[:, ai_index]
    else:
        ai_scores = (labels == config.ai_label).astype(float)

    chunk_predictions = build_chunk_predictions(features, labels, ai_scores, config)
    call_summary = summarize_call_risk(ai_scores, config)

    return {
        "audio_path": str(audio_path),
        "predicted_label": call_summary["final_call_verdict"],
        "ai_probability": call_summary["overall_ai_probability"],
        "ai_confidence_percent": call_summary["average_ai_confidence_percent"],
        "risk_level": call_summary["risk_level"],
        "warning": call_summary["warning"],
        "chunk_count": len(chunks),
        "ai_chunk_count": call_summary["ai_chunk_count"],
        "average_ai_confidence": call_summary["average_ai_confidence"],
        "average_ai_confidence_percent": call_summary["average_ai_confidence_percent"],
        "overall_risk_score": call_summary["overall_risk_score"],
        "overall_risk_percent": call_summary["overall_risk_percent"],
        "final_call_verdict": call_summary["final_call_verdict"],
        "chunk_predictions": chunk_predictions,
    }


def predict_live_audio_chunk(
    audio_path: str | Path,
    chunk_id: str = "live_chunk",
    config: PredictionConfig | None = None,
) -> dict[str, object]:
    config = config or PredictionConfig()
    audio_path = Path(audio_path)
    model_bundle = joblib.load(MODEL_PATH)
    model = model_bundle["model"]
    feature_columns = model_bundle["feature_columns"]
    label_encoder = model_bundle["label_encoder"]

    try:
        audio, sr = librosa.load(audio_path, sr=config.sample_rate, mono=True)
        audio = audio.astype(np.float32)
        # Measure the captured signal before normalization. Normalizing first makes
        # quiet background noise look like full-scale speech.
        rms = float(np.sqrt(np.mean(np.square(audio)))) if len(audio) else 0.0
    except Exception:
        return {
            "chunk_id": chunk_id,
            "predicted_label": "insufficient_audio",
            "raw_predicted_label": "chunk_parse_error",
            "ai_probability": 0.0,
            "ai_confidence_percent": 0.0,
            "risk_level": "safe",
            "warning": False,
            "chunk_count": 1,
            "current_chunk_risk": 0.0,
            "current_chunk_risk_percent": 0.0,
            "final_call_verdict": "insufficient_audio",
            "audio_rms": 0.0,
        }

    min_samples = int(config.min_chunk_duration_seconds * sr)
    max_samples = int(config.chunk_duration_seconds * sr)
    if len(audio) < min_samples or rms < config.min_live_rms:
        return {
            "chunk_id": chunk_id,
            "predicted_label": "insufficient_audio",
            "raw_predicted_label": "insufficient_audio",
            "ai_probability": 0.0,
            "ai_confidence_percent": 0.0,
            "risk_level": "safe",
            "warning": False,
            "chunk_count": 1,
            "current_chunk_risk": 0.0,
            "current_chunk_risk_percent": 0.0,
            "final_call_verdict": "insufficient_audio",
            "audio_rms": round(rms, 6),
            "attributed_generator": "No Speech Detected",
            "attribution_confidence": 0.0,
            "synthesis_technique": "Insufficient Audio / Silence",
            "spectral_cutoff_khz": 0.0,
        }

    audio = normalize_audio(audio)
    if len(audio) > max_samples:
        audio = audio[-max_samples:]

    features = extract_single_chunk_features(audio, sr, chunk_id=chunk_id)
    x = features[feature_columns]
    predictions = model.predict(x)
    labels = label_encoder.inverse_transform(predictions)

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(x)
        ai_index = int(label_encoder.transform([config.ai_label])[0])
        raw_ai_prob = float(probabilities[0, ai_index])
    else:
        raw_ai_prob = float(labels[0] == config.ai_label)

    raw_predicted_label = str(labels[0]).strip().lower()
    
    # Pure Real-Time Acoustic Prediction from the 98.75% VotingClassifier Ensemble
    display_probability = float(np.clip(raw_ai_prob, 0.01, 0.99))
    calibrated_label = "ai_generated" if display_probability >= 0.50 else "human"
    risk = "high" if display_probability >= 0.65 else "medium" if display_probability >= 0.40 else "safe"

    from backend.app.services.model_attribution_service import ModelAttributionService

    attribution = ModelAttributionService.attribute_audio_generator(
        display_probability,
        audio_rms=rms,
    )

    return {
        "chunk_id": chunk_id,
        "predicted_label": calibrated_label,
        "raw_predicted_label": raw_predicted_label,
        "ai_probability": round(display_probability, 4),
        "ai_confidence_percent": round(display_probability * 100, 2),
        "risk_level": risk,
        "warning": bool(calibrated_label == "ai_generated"),
        "chunk_count": 1,
        "current_chunk_risk": round(display_probability, 4),
        "current_chunk_risk_percent": round(display_probability * 100, 2),
        "final_call_verdict": calibrated_label,
        "audio_rms": round(rms, 6),
        "attributed_generator": attribution["attributed_generator"],
        "attribution_confidence": attribution["attribution_confidence"],
        "synthesis_technique": attribution["synthesis_technique"],
        "spectral_cutoff_khz": attribution["spectral_cutoff_khz"],
    }


def calibrate_probability(raw_probability: float, *, temperature: float = 3.0) -> float:
    clipped = float(np.clip(raw_probability, 1e-6, 1.0 - 1e-6))
    calibrated = 1.0 / (1.0 + np.exp(-np.log(clipped / (1.0 - clipped)) / temperature))
    return float(np.clip(calibrated, 0.0, 1.0))


def risk_level(ai_probability: float) -> str:
    if ai_probability >= 0.7:
        return "high"
    if ai_probability >= 0.4:
        return "medium"
    return "low"


def build_chunk_predictions(
    features: pd.DataFrame,
    labels: np.ndarray,
    ai_scores: np.ndarray,
    config: PredictionConfig,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    for index in range(len(features)):
        ai_probability = float(ai_scores[index])
        calibrated_probability = calibrate_probability(ai_probability)
        calibrated_label = config.ai_label if calibrated_probability >= config.ai_chunk_threshold else "human"
        rows.append(
            {
                "chunk_id": str(features.iloc[index]["chunk_id"]),
                "start_time_seconds": float(features.iloc[index]["start_time_seconds"]),
                "end_time_seconds": float(features.iloc[index]["end_time_seconds"]),
                "predicted_label": calibrated_label,
                "raw_predicted_label": str(labels[index]),
                "ai_probability": round(calibrated_probability, 4),
                "ai_confidence_percent": round(calibrated_probability * 100, 2),
                "risk_level": risk_level(calibrated_probability),
                "warning": bool(calibrated_probability >= config.warning_threshold),
            }
        )

    return rows


def summarize_call_risk(
    ai_scores: np.ndarray,
    config: PredictionConfig,
) -> dict[str, object]:
    if len(ai_scores) == 0:
        raise ValueError("No chunk scores available for call risk calculation.")

    scores = np.asarray(ai_scores, dtype=float)
    average_score = float(np.mean(scores))
    max_score = float(np.max(scores))
    ai_chunk_count = int(np.sum(scores >= config.ai_chunk_threshold))
    ai_chunk_ratio = float(ai_chunk_count / len(scores))

    # Call-level risk combines sustained evidence and a single strong spike.
    # This is intentionally more stable than using only the latest chunk.
    overall_score = (0.55 * average_score) + (0.30 * ai_chunk_ratio) + (0.15 * max_score)
    overall_score = calibrate_probability(overall_score)

    final_verdict = config.ai_label if (
        overall_score >= 0.5
        or ai_chunk_ratio >= 0.3
        or max_score >= 0.6
    ) else "human"

    return {
        "overall_ai_probability": round(overall_score, 4),
        "average_ai_confidence": round(average_score, 4),
        "average_ai_confidence_percent": round(average_score * 100, 2),
        "overall_risk_score": round(overall_score, 4),
        "overall_risk_percent": round(overall_score * 100, 2),
        "ai_chunk_count": ai_chunk_count,
        "risk_level": risk_level(overall_score),
        "warning": bool(final_verdict == config.ai_label),
        "final_call_verdict": final_verdict,
    }
