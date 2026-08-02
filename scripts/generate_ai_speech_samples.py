import asyncio
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "ml" / "data" / "raw" / "ai_generated"

PHRASES = [
    "Your bank account has been temporarily locked for security verification.",
    "Please confirm the one time password sent to your phone.",
    "This is an urgent call from the fraud prevention department.",
    "Your payment card will be suspended unless verification is completed.",
    "We detected unusual activity on your account this morning.",
    "Please stay on the line while we validate your identity.",
    "A new login attempt was detected from another device.",
    "Your mobile number must be verified to continue service.",
    "Failure to respond may result in temporary account restriction.",
    "Please provide the verification code to complete the process.",
]

VOICES = [
    "en-US-AriaNeural",
    "en-US-GuyNeural",
    "en-GB-SoniaNeural",
    "en-GB-RyanNeural",
    "en-IN-NeerjaNeural",
    "en-IN-PrabhatNeural",
]


async def generate_samples(count: int = 50) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for index in range(1, count + 1):
        phrase = PHRASES[(index - 1) % len(PHRASES)]
        speaker_id = f"spk{((index - 1) % len(VOICES)) + 1:04d}"
        filename = f"ai_generated_gtts_{speaker_id}_{index:04d}.mp3"
        output_path = OUTPUT_DIR / filename

        await asyncio.to_thread(save_with_gtts, phrase, output_path)


def save_with_gtts(text: str, output_path: Path) -> None:
    try:
        from gtts import gTTS
    except ImportError as exc:
        raise SystemExit(
            "gTTS is not installed. Install it with: "
            "python -m pip install --target CallShield/.venv/Lib/site-packages gTTS"
        ) from exc

    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(str(output_path))


if __name__ == "__main__":
    sample_count = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    asyncio.run(generate_samples(sample_count))
