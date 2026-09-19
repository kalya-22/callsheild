"""
Automated Kaggle Dataset Ingestion and Retraining Pipeline for CallShield.
Downloads curated real-world DeepFake Voice audio, applies Telecom GSM augmentation,
and retrains the VotingClassifier ensemble model.
"""
from __future__ import annotations

import os
import shutil
import zipfile
from pathlib import Path
import librosa
import numpy as np
import soundfile as sf
from scipy import signal
from kaggle.api.kaggle_api_extended import KaggleApi

PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = PROJECT_ROOT / "ml" / "data" / "raw" / "kaggle_temp"
CHUNKS_DIR = PROJECT_ROOT / "ml" / "data" / "chunks"
AI_CHUNKS_DIR = CHUNKS_DIR / "ai_generated"
HUMAN_CHUNKS_DIR = CHUNKS_DIR / "human"

TARGET_SR = 16000
CHUNK_DURATION = 3.0  # 3 second slices
SAMPLES_PER_CHUNK = int(TARGET_SR * CHUNK_DURATION)

def apply_gsm_telecom_filter(audio: np.ndarray, sr: int = TARGET_SR) -> np.ndarray:
    """Applies GSM bandpass (300Hz - 3400Hz) phone filter."""
    sos = signal.butter(4, [300, 3400], btype='bandpass', fs=sr, output='sos')
    filtered = signal.sosfilt(sos, audio)
    # Add light ambient room noise for realism (18dB SNR)
    noise = np.random.normal(0, np.std(filtered) * 0.04, len(filtered))
    return filtered + noise

def download_kaggle_dataset(dataset_ref: str = "birdy654/deep-voice-deepfake-voice-recognition") -> Path:
    print(f"Downloading Kaggle dataset: {dataset_ref}...")
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    api = KaggleApi()
    api.authenticate()
    
    api.dataset_download_files(dataset_ref, path=str(RAW_DIR), unzip=True)
    print("Download and extraction complete!")
    return RAW_DIR

def process_and_chunk_audio(source_path: Path, is_ai: bool, max_files: int = 150) -> int:
    dest_dir = AI_CHUNKS_DIR if is_ai else HUMAN_CHUNKS_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    audio_files = list(source_path.rglob("*.wav")) + list(source_path.rglob("*.mp3"))
    print(f"Found {len(audio_files)} files for {'AI Deepfake' if is_ai else 'Human Real Voice'}. Processing up to {max_files}...")
    
    saved_chunks = 0
    prefix = "kaggle_ai" if is_ai else "kaggle_human"
    
    for i, file_path in enumerate(audio_files[:max_files]):
        try:
            y, sr = librosa.load(str(file_path), sr=TARGET_SR, mono=True)
            # Apply Telecom GSM augmentation
            y_gsm = apply_gsm_telecom_filter(y, sr)
            
            # Slice into 3-second chunks
            total_samples = len(y_gsm)
            chunk_idx = 0
            for start in range(0, total_samples, SAMPLES_PER_CHUNK):
                chunk = y_gsm[start : start + SAMPLES_PER_CHUNK]
                if len(chunk) < SAMPLES_PER_CHUNK // 2:  # skip chunks shorter than 1.5s
                    continue
                
                # Normalize chunk amplitude
                max_val = np.max(np.abs(chunk))
                if max_val > 0:
                    chunk = chunk / max_val * 0.90
                
                out_name = f"{prefix}_{i:04d}_c{chunk_idx:03d}.wav"
                out_path = dest_dir / out_name
                sf.write(str(out_path), chunk, TARGET_SR)
                saved_chunks += 1
                chunk_idx += 1
        except Exception as e:
            continue
            
    print(f"  -> Created {saved_chunks} telecom-augmented chunks for {'AI' if is_ai else 'Human'}")
    return saved_chunks

def main() -> None:
    os.environ["KAGGLE_API_TOKEN"] = "KGAT_40479039a49886139c44a9925c44947b"
    raw_path = download_kaggle_dataset()
    
    # Identify Fake and Real folders in extracted dataset
    ai_dirs = [d for d in raw_path.rglob("*") if d.is_dir() and any(k in d.name.lower() for k in ["fake", "ai", "synthetic", "cloned", "deepfake"])]
    human_dirs = [d for d in raw_path.rglob("*") if d.is_dir() and any(k in d.name.lower() for k in ["real", "human", "authentic", "original"])]
    
    ai_src = ai_dirs[0] if ai_dirs else raw_path
    human_src = human_dirs[0] if human_dirs else raw_path
    
    print(f"AI source folder: {ai_src}")
    print(f"Human source folder: {human_src}")
    
    ai_count = process_and_chunk_audio(ai_src, is_ai=True, max_files=150)
    human_count = process_and_chunk_audio(human_src, is_ai=False, max_files=150)
    
    # Cleanup temp raw files to conserve disk space
    shutil.rmtree(str(RAW_DIR), ignore_errors=True)
    print("Temporary Kaggle download cleaned up.")
    
    print(f"\nTotal new Kaggle chunks added: {ai_count + human_count}")
    print("Starting Model Retraining with new Kaggle Deepfake dataset...")
    
    from ml.src.training.train_multilingual_model import train_multilingual_model
    train_multilingual_model()

if __name__ == "__main__":
    main()
