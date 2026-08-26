import os
import sys
from pathlib import Path
import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

RAW_DATA_DIR = PROJECT_ROOT / "ml" / "data" / "raw"
AI_DIR = RAW_DATA_DIR / "ai_generated"
HUMAN_DIR = RAW_DATA_DIR / "human"


def butter_bandpass(lowcut: float, highcut: float, fs: int, order: int = 5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype="band")
    return b, a


def apply_telecom_gsm_filter(audio: np.ndarray, sr: int = 16000) -> np.ndarray:
    """
    Simulates cellular telephone network codec (GSM 300Hz - 3400Hz bandpass filter).
    """
    try:
        b, a = butter_bandpass(300.0, 3400.0, sr, order=4)
        filtered = lfilter(b, a, audio)
        return filtered.astype(np.float32)
    except Exception:
        return audio


def add_background_noise(audio: np.ndarray, snr_db: float = 12.0) -> np.ndarray:
    """
    Injects realistic ambient background noise at a specific Signal-to-Noise Ratio (SNR).
    """
    signal_power = np.mean(audio ** 2)
    if signal_power == 0:
        return audio

    noise = np.random.normal(0, 1, len(audio))
    noise_power = np.mean(noise ** 2)

    # Calculate required noise scalar for desired SNR in dB
    snr_linear = 10.0 ** (snr_db / 10.0)
    noise_scaling = np.sqrt(signal_power / (snr_linear * noise_power))

    noisy_audio = audio + noise_scaling * noise
    return noisy_audio.astype(np.float32)


def apply_pitch_and_speed_shift(audio: np.ndarray, sr: int = 16000, n_steps: float = 1.5) -> np.ndarray:
    """
    Simulates speakerphone acoustic variation via subtle pitch shifting.
    """
    try:
        shifted = librosa.effects.pitch_shift(y=audio, sr=sr, n_steps=n_steps)
        return shifted.astype(np.float32)
    except Exception:
        return audio


def augment_directory(directory: Path):
    if not directory.exists():
        return

    count = 0
    audio_files = [f for f in directory.glob("*.*") if f.suffix.lower() in [".wav", ".mp3", ".flac", ".ogg"] and "_aug_" not in f.name]
    print(f"🎛️ Augmenting {len(audio_files)} files in {directory.name}...")

    for file_path in audio_files:
        try:
            audio, sr = librosa.load(str(file_path), sr=16000, mono=True)
            if len(audio) < sr * 0.5:
                continue

            stem = file_path.stem

            # 1. Telecom GSM Bandpass Filtered Variation
            telecom_audio = apply_telecom_gsm_filter(audio, sr)
            sf.write(str(directory / f"{stem}_aug_gsm.wav"), telecom_audio, sr)
            count += 1

            # 2. Ambient Noise Injected Variation
            noisy_audio = add_background_noise(audio, snr_db=15.0)
            sf.write(str(directory / f"{stem}_aug_noise.wav"), noisy_audio, sr)
            count += 1

            # 3. Speakerphone Pitch Shift Variation
            pitched_audio = apply_pitch_and_speed_shift(audio, sr, n_steps=1.5)
            sf.write(str(directory / f"{stem}_aug_pitch.wav"), pitched_audio, sr)
            count += 1

        except Exception as err:
            print(f"Warning augmenting {file_path.name}: {err}")

    print(f"✅ Created {count} augmented telecom and noise samples in {directory.name}")


def main():
    print("🚀 Starting Telecom & Noise Data Augmentation Pipeline...")
    augment_directory(AI_DIR)
    augment_directory(HUMAN_DIR)
    print("🎉 Data Augmentation Complete! Dataset is now 4x larger.")


if __name__ == "__main__":
    main()
