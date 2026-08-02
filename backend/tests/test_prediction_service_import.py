import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pandas as pd
import soundfile as sf


def test_prediction_service_imports() -> None:
    backend_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_root))

    from app.services.prediction_service import predict_uploaded_audio

    assert callable(predict_uploaded_audio)


def test_audio_preprocessing_runs(tmp_path: Path) -> None:
    from ml.src.inference.predict_audio import PredictionConfig, preprocess_audio_file

    audio = np.sin(np.linspace(0, 2 * np.pi * 440, 16000)).astype(np.float32)
    audio_path = tmp_path / "sample.wav"
    sf.write(audio_path, audio, 16000)

    processed, sr = preprocess_audio_file(audio_path, PredictionConfig(sample_rate=16000))

    assert sr == 16000
    assert processed.size > 0


def test_live_monitoring_is_conservative_for_human_speech(tmp_path: Path, monkeypatch) -> None:
    from ml.src.inference import predict_audio as predict_audio_module

    audio = np.sin(np.linspace(0, 2 * np.pi * 440, 16000)).astype(np.float32)
    audio_path = tmp_path / "live.wav"
    sf.write(audio_path, audio, 16000)

    class FakeModel:
        def predict(self, x):
            return np.array([0])

        def predict_proba(self, x):
            return np.array([[0.21, 0.79]])

    class FakeLabelEncoder:
        def transform(self, labels):
            return np.array([1])

        def inverse_transform(self, labels):
            return np.array(["ai_generated"])

    monkeypatch.setattr(
        predict_audio_module.joblib,
        "load",
        lambda _: {"model": FakeModel(), "feature_columns": ["mfcc_1_mean"], "label_encoder": FakeLabelEncoder()},
    )
    monkeypatch.setattr(
        predict_audio_module,
        "extract_single_chunk_features",
        lambda chunk, sr, chunk_id="live_chunk": pd.DataFrame({"mfcc_1_mean": [0.1]}),
    )

    result = predict_audio_module.predict_live_audio_chunk(audio_path, chunk_id="live_chunk")

    assert result["predicted_label"] == "human"
    assert result["warning"] is False


def test_live_monitoring_probabilities_stay_in_midrange(tmp_path: Path, monkeypatch) -> None:
    from ml.src.inference import predict_audio as predict_audio_module

    audio = np.sin(np.linspace(0, 2 * np.pi * 440, 16000)).astype(np.float32)
    audio_path = tmp_path / "live.wav"
    sf.write(audio_path, audio, 16000)

    class FakeModel:
        def predict(self, x):
            return np.array([1])

        def predict_proba(self, x):
            return np.array([[0.02, 0.98]])

    class FakeLabelEncoder:
        def transform(self, labels):
            return np.array([1])

        def inverse_transform(self, labels):
            return np.array(["ai_generated"])

    monkeypatch.setattr(
        predict_audio_module.joblib,
        "load",
        lambda _: {"model": FakeModel(), "feature_columns": ["mfcc_1_mean"], "label_encoder": FakeLabelEncoder()},
    )
    monkeypatch.setattr(
        predict_audio_module,
        "extract_single_chunk_features",
        lambda chunk, sr, chunk_id="live_chunk": pd.DataFrame({"mfcc_1_mean": [0.1]}),
    )

    result = predict_audio_module.predict_live_audio_chunk(audio_path, chunk_id="live_chunk")

    assert 0.2 <= result["ai_probability"] <= 0.8
