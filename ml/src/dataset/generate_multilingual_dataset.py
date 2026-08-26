import os
import sys
from pathlib import Path
from gtts import gTTS

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
RAW_DATA_DIR = PROJECT_ROOT / "ml" / "data" / "raw"
AI_DIR = RAW_DATA_DIR / "ai_generated"
HUMAN_DIR = RAW_DATA_DIR / "human"

AI_DIR.mkdir(parents=True, exist_ok=True)
HUMAN_DIR.mkdir(parents=True, exist_ok=True)

# English + Hindi Vishing Scam & Customer Service Prompts
HINDI_SCAM_SCRIPTS = [
    "नमस्कार! मैं एचडीएफसी बैंक क्रेडिट कार्ड विभाग से बोल रहा हूं। आपका कार्ड ब्लॉक हो गया है।",
    "सर, आपकी 25 लाख रुपये की लॉटरी लगी है। पुरस्कार राशि पाने के लिए तुरंत अपना पिन दर्ज करें।",
    "यह साइबर सुरक्षा पुलिस स्टेशन से आपातकालीन सूचना है। आपका आधार कार्ड संदिग्ध लेन-देन में पाया गया है।",
    "हेलो! आपके बिजली कनेक्शन का भुगतान बकाया है। आज रात 9 बजे तक कनेक्शन काट दिया जाएगा।",
    "प्रिय ग्राहक, आपका सिम कार्ड तुरंत बंद किया जा रहा है। वेरिफिकेशन के लिए 1 दबाएं।",
    "नमस्ते, मैं बैंक ऑफ बड़ौदा से बोल रहा हूं। आपके अकाउंट में अनधिकृत लॉगिन देखा गया है।",
    "शुभ प्रभात! आपके बीमा पॉलिसी का बोनस जारी कर दिया गया है। तुरंत क्लेम करें।",
    "सावधान! आपका गूगल पे अकाउंट सस्पेंड होने वाला है। तुरंत अपना यूपीआई पिन सत्यापित करें।",
]

ENGLISH_SCAM_SCRIPTS = [
    "Hello! This is an urgent message from HDFC Bank. Your account access has been suspended due to suspicious activity.",
    "Congratulations! You have won a cash prize of 50,000 dollars. Press 1 to claim your reward immediately.",
    "This is the Income Tax Department calling. A legal warrant has been issued under your name. Stay on the line.",
    "Your Amazon parcel delivery has failed. Please verify your credit card credentials to reschedule shipping.",
    "Warning! Your personal computer has been infected with a dangerous virus. Call tech support right away.",
    "Good morning. This is your mobile service provider calling. Your SIM card will be deactivated in two hours.",
    "Important notification! Your loan request has been pre-approved. Transfer processing fee to receive funds.",
    "Hello! We detected an unauthorized login to your Google account from an unknown device.",
]

HINDI_HUMAN_SCRIPTS = [
    "अरे भाई! क्या हाल है? शाम को चाय पीने मिल रहे हैं क्या?",
    "मम्मी, मैं 10 मिनट में घर पहुंच रहा हूं, रास्ते में बहुत ट्रैफिक है।",
    "कल की मीटिंग का समय बदल गया है, कृपया अपनी ईमेल चेक कर लीजिए।",
    "नमस्ते जी! आज का मौसम कितना सुहाना है ना?",
    "सुनो, बाजार से दूध और सब्जियां लेते आना भूलना मत।",
]

ENGLISH_HUMAN_SCRIPTS = [
    "Hey! How are you doing? Let's catch up over coffee this evening.",
    "Mom, I'll be home in about 15 minutes. The traffic is a bit slow today.",
    "Please review the attached project document before our team call tomorrow.",
    "Good morning! Hope you have a wonderful and productive day ahead.",
    "Don't forget to grab some groceries on your way back from work.",
]


def generate_audio_dataset():
    print("🎙️ Starting English + Hindi Dual-Language Dataset Generation...")
    count = 0

    # 1. Generate Hindi AI Voice Chunks
    for idx, text in enumerate(HINDI_SCAM_SCRIPTS, 1):
        filename = AI_DIR / f"hindi_ai_scam_{idx:03d}.mp3"
        print(f"Generating Hindi AI Voice: {filename.name}")
        tts = gTTS(text=text, lang="hi", slow=False)
        tts.save(str(filename))
        count += 1

    # 2. Generate English AI Voice Chunks
    for idx, text in enumerate(ENGLISH_SCAM_SCRIPTS, 1):
        filename = AI_DIR / f"english_ai_scam_{idx:03d}.mp3"
        print(f"Generating English AI Voice: {filename.name}")
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(str(filename))
        count += 1

    # 3. Generate Hindi Natural Speech Samples
    for idx, text in enumerate(HINDI_HUMAN_SCRIPTS, 1):
        filename = HUMAN_DIR / f"hindi_human_speech_{idx:03d}.mp3"
        print(f"Generating Hindi Natural Speech: {filename.name}")
        tts = gTTS(text=text, lang="hi", slow=True)
        tts.save(str(filename))
        count += 1

    # 4. Generate English Natural Speech Samples
    for idx, text in enumerate(ENGLISH_HUMAN_SCRIPTS, 1):
        filename = HUMAN_DIR / f"english_human_speech_{idx:03d}.mp3"
        print(f"Generating English Natural Speech: {filename.name}")
        tts = gTTS(text=text, lang="en", slow=True)
        tts.save(str(filename))
        count += 1

    print(f"✅ Generated {count} English & Hindi audio samples in {RAW_DATA_DIR}")


if __name__ == "__main__":
    generate_audio_dataset()
