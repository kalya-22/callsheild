import os
import sys
from pathlib import Path
import librosa
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

RAW_DATA_DIR = PROJECT_ROOT / "ml" / "data" / "raw"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODELS_DIR / "baseline_model.joblib"
ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"


from ml.src.features.extract_audio_features import FeatureExtractionConfig
from ml.src.inference.predict_audio import extract_features_for_chunk_from_absolute_path


def extract_features_from_audio(audio_path: Path, sr: int = 16000) -> dict[str, object] | None:
    try:
        config = FeatureExtractionConfig(sample_rate=sr)
        row = pd.Series({
            "chunk_id": audio_path.stem,
            "parent_sample_id": audio_path.stem,
            "label": "unknown",
            "chunk_path": str(audio_path),
            "duration_seconds": 3.0,
        })
        features = extract_features_for_chunk_from_absolute_path(row, config)
        # Exclude metadata columns
        non_feature_cols = {"chunk_id", "parent_sample_id", "label", "chunk_path", "duration_seconds", "sample_rate"}
        return {k: v for k, v in features.items() if k not in non_feature_cols}
    except Exception as err:
        print(f"Error extracting features from {audio_path.name}: {err}")
        return None


def train_multilingual_model():
    print("🧠 Starting English + Hindi ML Model Training Pipeline...")

    feature_rows = []
    labels = []

    # 1. Process AI-generated samples
    ai_dir = RAW_DATA_DIR / "ai_generated"
    if ai_dir.exists():
        for file_path in ai_dir.glob("*.*"):
            if file_path.suffix.lower() in [".wav", ".mp3", ".flac", ".ogg"]:
                feat = extract_features_from_audio(file_path)
                if feat:
                    feature_rows.append(feat)
                    labels.append("ai_generated")

    # 2. Process Human natural speech samples
    human_dir = RAW_DATA_DIR / "human"
    if human_dir.exists():
        for file_path in human_dir.glob("*.*"):
            if file_path.suffix.lower() in [".wav", ".mp3", ".flac", ".ogg"]:
                feat = extract_features_from_audio(file_path)
                if feat:
                    feature_rows.append(feat)
                    labels.append("human")

    if not feature_rows:
        print("❌ No audio files found in raw dataset directories!")
        return

    df_features = pd.DataFrame(feature_rows)
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(labels)

    print(f"📊 Training on {len(df_features)} audio chunks ({labels.count('ai_generated')} AI vs {labels.count('human')} Human)")

    # 3. Build Multi-Model Ensemble (Random Forest + Gradient Boosting)
    rf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, random_state=42)

    ensemble = VotingClassifier(estimators=[("rf", rf), ("gb", gb)], voting="soft")

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", ensemble)
    ])

    pipeline.fit(df_features, y)
    accuracy = pipeline.score(df_features, y)

    # 4. Save trained model bundle & label encoder
    model_bundle = {
        "model": pipeline,
        "feature_columns": list(df_features.columns),
        "label_encoder": label_encoder,
    }
    joblib.dump(model_bundle, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)

    print(f"🎉 Model Training Complete!")
    print(f"✅ Training Accuracy: {accuracy * 100:.2f}%")
    print(f"💾 Saved English + Hindi ML Model Bundle to {MODEL_PATH}")


if __name__ == "__main__":
    train_multilingual_model()
