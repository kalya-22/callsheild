import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class MasterNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(MasterNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(MasterNumberedCanvas, self).showPage()
        super(MasterNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0F172A"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "CallShield — Master Project Specification & IEEE Implementation Manual")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "100% Real-Time Acoustic Forensic Platform")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Footer (All pages)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(8.5 * 72 - 54, 34, page_str)
        self.drawString(54, 34, "CallShield • Complete Technical Reference & IEEE Implementation Document")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 44, 8.5 * 72 - 54, 44)
        
        self.restoreState()

def build_master_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    styles = getSampleStyleSheet()
    
    # Palette
    c_slate900 = colors.HexColor("#0F172A")
    c_blue700  = colors.HexColor("#1D4ED8")
    c_teal700  = colors.HexColor("#0F766E")
    c_slate800 = colors.HexColor("#1E293B")
    c_slate600 = colors.HexColor("#475569")
    c_card_bg  = colors.HexColor("#F8FAFC")
    c_border   = colors.HexColor("#E2E8F0")
    c_code_bg  = colors.HexColor("#F1F5F9")

    # Typography Styles
    style_main_title = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_slate900,
        spaceAfter=4
    )

    style_main_sub = ParagraphStyle(
        'MainSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=c_blue700,
        spaceAfter=12
    )

    style_h1 = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_slate900,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_teal700,
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_slate800,
        spaceAfter=5
    )

    style_bullet = ParagraphStyle(
        'Bullet',
        parent=style_body,
        leftIndent=14,
        firstLineIndent=-9,
        spaceAfter=3
    )

    style_math = ParagraphStyle(
        'Math',
        parent=styles['Normal'],
        fontName='Courier-Oblique',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=3,
        spaceAfter=5
    )

    style_code_block = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=c_slate900,
        backColor=c_code_bg,
        borderPadding=4,
        spaceBefore=4,
        spaceAfter=6
    )

    style_th = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    style_td = ParagraphStyle(
        'TD',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=c_slate800
    )

    style_qa_q = ParagraphStyle(
        'QA_Q',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_blue700,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    style_qa_a = ParagraphStyle(
        'QA_A',
        parent=style_body,
        leftIndent=10,
        spaceAfter=6
    )

    story = []

    # =========================================================================
    # HEADER & EXECUTIVE METADATA
    # =========================================================================
    story.append(Paragraph("🛡️ CallShield: Master Technical Specification & Implementation Guide", style_main_title))
    story.append(Paragraph("A Comprehensive Real-Time Acoustic Forensic & Telephony-Integrated Anti-Vishing Platform", style_main_sub))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_blue700, spaceBefore=0, spaceAfter=8))

    meta_table = [
        [
            Paragraph("<b>Project Lead & Developer:</b> Kalyan Kumar", style_td),
            Paragraph("<b>Core Classifier:</b> ExtraTrees Ensemble (F1 = 0.9038)", style_td)
        ],
        [
            Paragraph("<b>Client Framework:</b> React Native & Expo SDK 52 (Android)", style_td),
            Paragraph("<b>Feature Vector:</b> 60 Physical & Acoustic Biomarkers", style_td)
        ],
        [
            Paragraph("<b>Backend Engine:</b> FastAPI + Uvicorn (Render Cloud)", style_td),
            Paragraph("<b>Inference Speed:</b> &lt; 15 ms per 2.5s Audio Chunk", style_td)
        ],
        [
            Paragraph("<b>Database:</b> Supabase PostgreSQL + AsyncStorage", style_td),
            Paragraph("<b>Telecom Filter:</b> GSM 300Hz-3400Hz Bandpass + 18dB SNR", style_td)
        ]
    ]
    t_m = Table(meta_table, colWidths=[256, 256])
    t_m.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_m)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 1: PROBLEM STATEMENT & THREAT LANDSCAPE
    # =========================================================================
    story.append(Paragraph("1. Executive Overview & Vishing Threat Landscape", style_h1))
    story.append(Paragraph(
        "<b>The Cybersecurity Threat:</b> Over the past two years, the emergence of generative neural text-to-speech (TTS), latent diffusion vocoders, and zero-shot voice cloning tools (such as ElevenLabs, WaveNet, and Voice-to-Voice conversions) has weaponized voice synthesis. Cybercriminals require only 3–5 seconds of a victim's reference audio to clone their vocal timbre, prosody, and emotional inflections with indistinguishable realism. This has catalyzed a massive surge in <b>vishing (voice phishing)</b> crimes, including:",
        style_body
    ))
    story.append(Paragraph("• <b>Bank OTP & Credential Harvesting:</b> Cloned IVR bots and fake financial officers deceiving victims into disclosing multi-factor authentication codes.", style_bullet))
    story.append(Paragraph("• <b>Emergency Kidnap & Extortion:</b> Impersonating family members in distress to demand immediate ransom transfers.", style_bullet))
    story.append(Paragraph("• <b>Executive CEO & Wire Fraud:</b> Replicating corporate leadership voices to mandate unauthorized corporate wire transfers.", style_bullet))
    story.append(Paragraph(
        "<b>Why Current Solutions Fail:</b> Conventional caller ID applications (e.g., Truecaller) operate strictly on static databases of reported telephone numbers. Because attackers utilize Voice-over-IP (VoIP) caller ID spoofing and disposable virtual SIMs, number blacklists are bypassed instantly. <i>Existing defenses perform zero acoustic inspection of the live voice.</i>",
        style_body
    ))
    story.append(Paragraph(
        "<b>The CallShield Solution:</b> CallShield is a real-time mobile and cloud security platform that intercepts cellular phone calls natively on Android, streams 2.5-second live audio chunks, extracts 60 physical vocal biomarkers (micro-jitter, shimmer, ΔΔ-MFCCs, spectral flatness), and evaluates voice authenticity using an ExtraTrees Ensemble in under 15 milliseconds. When an AI clone is detected, a full-screen red siren is triggered with automated 1-tap call termination.",
        style_body
    ))

    # =========================================================================
    # SECTION 2: END-TO-END SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("2. System Architecture & Component Interactions", style_h1))
    story.append(Paragraph(
        "CallShield utilizes a multi-tier collaborative edge-cloud architecture designed for microsecond latency, zero data retention, and continuous real-time telemetry:",
        style_body
    ))

    arch_table = [
        [Paragraph("System Layer", style_th), Paragraph("Technologies", style_th), Paragraph("Exact Role & Functionality", style_th)],
        [
            Paragraph("<b>1. Telephony Client</b>", style_td),
            Paragraph("React Native (Expo 52)<br/>Android Java Native Modules<br/>AsyncStorage", style_td),
            Paragraph("Subscribes to <code>PhoneStateListener</code>, intercepts <code>CALL_STATE_RINGING</code>, records 16kHz mono PCM, displays HUD overlays, and executes <code>TelecomManager.endCall()</code>.", style_td)
        ],
        [
            Paragraph("<b>2. REST & WebSocket API</b>", style_td),
            Paragraph("FastAPI (Python 3.11)<br/>Uvicorn / Gunicorn<br/>Render Container Cloud", style_td),
            Paragraph("Non-blocking asynchronous server managing streaming endpoints (<code>/api/v1/predict/live</code>), WebSocket telemetry, silence threshold gating, and threadpool scheduling.", style_td)
        ],
        [
            Paragraph("<b>3. DSP & Feature Engine</b>", style_td),
            Paragraph("Librosa 0.10+<br/>SciPy Signal<br/>SoundFile C-Bindings", style_td),
            Paragraph("Performs sliding window chunking (2.5s duration, 1.5s hop), peak amplitude normalization, and extracts 60 physical vocal biomarkers.", style_td)
        ],
        [
            Paragraph("<b>4. ML Classification</b>", style_td),
            Paragraph("Scikit-Learn ExtraTrees<br/>VotingClassifier<br/>Attribution Engine", style_td),
            Paragraph("Evaluates 100 randomized decision trees to compute calibrated threat probabilities and attributes specific AI synthesis architecture (ElevenLabs, WaveNet, V2V).", style_td)
        ],
        [
            Paragraph("<b>5. Persistence & Cloud DB</b>", style_td),
            Paragraph("Supabase (PostgreSQL)<br/>PBKDF2 Cryptography", style_td),
            Paragraph("Stores encrypted user authentication records, forensic chunk timelines (<code>prediction_history</code>), and crowdsourced scam blacklists (<code>scam_blacklist</code>).", style_td)
        ]
    ]
    t_arch = Table(arch_table, colWidths=[90, 130, 292])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate900),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 3: SIGNAL PROCESSING & THE 60 ACOUSTIC BIOMARKERS
    # =========================================================================
    story.append(Paragraph("3. Acoustic Signal Processing & The 60 Forensic Biomarkers", style_h1))
    story.append(Paragraph(
        "Audio signals are sampled at $f_s = 16\\text{ kHz}$ mono. Continuous speech is segmented into sliding windows of $T = 2.5\\text{ seconds}$ (40,000 samples) with an overlap hop of $1.5\\text{ seconds}$. Each chunk is transformed into a 60-dimensional feature vector $\\mathbf{x} \\in \\mathbb{R}^{60}$:",
        style_body
    ))

    feat_table = [
        [Paragraph("Feature Group", style_th), Paragraph("Count", style_th), Paragraph("Mathematical Description & Biometric Significance", style_th)],
        [
            Paragraph("<b>1. Static MFCCs</b>", style_td),
            Paragraph("26", style_td),
            Paragraph("13 MFCC means + 13 MFCC stds. Captures the physical resonant cavity shape of the human vocal tract (formants) via Discrete Cosine Transform on Mel-scaled filterbanks.", style_td)
        ],
        [
            Paragraph("<b>2. Dynamic Δ-MFCCs</b>", style_td),
            Paragraph("26", style_td),
            Paragraph("13 First-Order Delta means + 13 Delta stds. Quantifies the instantaneous velocity of spectral transitions across speech frames, exposing unnatural vocoder transitions.", style_td)
        ],
        [
            Paragraph("<b>3. Vocal Micro-Jitter</b>", style_td),
            Paragraph("1", style_td),
            Paragraph("Measures cycle-to-cycle fundamental pitch period perturbation. Organic vocal cords exhibit natural micro-tremor ($1.0\\% - 2.5\\%$); AI models produce unnaturally smooth pitch periods ($&lt; 0.1\\%$).", style_td)
        ],
        [
            Paragraph("<b>4. Acoustic Shimmer</b>", style_td),
            Paragraph("1", style_td),
            Paragraph("Cycle-to-cycle peak amplitude perturbation across glottal cycles. Evaluates sub-glottal pressure stability.", style_td)
        ],
        [
            Paragraph("<b>5. Spectral Flatness & Rolloff</b>", style_td),
            Paragraph("4", style_td),
            Paragraph("Spectral flatness measures tonal-to-noise ratio (detects neural vocoder high-frequency artifacts). Spectral rolloff ($R_{85}$) pinpoints artificial frequency cutoff caps at 16kHz or 20kHz.", style_td)
        ],
        [
            Paragraph("<b>6. Spectral Centroid & ZCR</b>", style_td),
            Paragraph("2", style_td),
            Paragraph("Spectral center of mass and Zero-Crossing Rate (ZCR) to measure unvoiced fricative energy and harmonic distribution.", style_td)
        ]
    ]
    t_feat = Table(feat_table, colWidths=[110, 40, 362])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal700),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 8))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: TELECOM-GRADE CHANNEL MODELING
    # =========================================================================
    story.append(Paragraph("4. Telecom-Grade Channel Modeling (Overcoming the Studio Trap)", style_h1))
    story.append(Paragraph(
        "<b>The Studio Trap Problem:</b> Machine learning models trained exclusively on full-spectrum studio audio ($20\\text{ Hz} - 20,000\\text{ Hz}$) fail catastrophically on real cellular calls because cellular telephone networks (GSM, VoLTE, PSTN G.711) truncate high and low frequencies. To ensure robust real-world performance, CallShield applies telecom-grade channel transformations:",
        style_body
    ))
    story.append(Paragraph("1) <b>4th-Order Butterworth Bandpass Filter ($300\\text{ Hz} - 3400\\text{ Hz}$):</b> Filters out sub-bass and extreme treble, matching native GSM cellular network codecs.", style_bullet))
    story.append(Paragraph("2) <b>Gaussian Channel Noise Injection ($18\\text{ dB}$ SNR):</b> Simulates ambient room acoustics and microphone static.", style_bullet))
    story.append(Paragraph("3) <b>Downsampling to $16\\text{ kHz}$ Mono PCM:</b> Matches mobile telephony hardware capture pipelines.", style_bullet))

    # =========================================================================
    # SECTION 5: MACHINE LEARNING CLASSIFIER & ENSEMBLE THEORY
    # =========================================================================
    story.append(Paragraph("5. Machine Learning Architecture: ExtraTrees Ensemble", style_h1))
    story.append(Paragraph(
        "<b>Model Selected:</b> **ExtraTrees (Extremely Randomized Trees) Classifier** (`ml/models/baseline_model.joblib`) consisting of 100 randomized decision trees.",
        style_body
    ))
    story.append(Paragraph(
        "<b>Mathematical Formulation:</b> At each split node, ExtraTrees selects a random subset of $K = \\sqrt{P} = \\sqrt{60} \\approx 8$ features. For each feature, a split threshold $a_k^*$ is drawn <i>uniformly at random</i> from $[\min(x_k), \\max(x_k)]$, and the threshold maximizing Gini Impurity reduction is chosen:",
        style_body
    ))
    story.append(Paragraph("$$\\Delta I(S, a^*) = I(S) - \\frac{|S_L|}{|S|} I(S_L) - \\frac{|S_R|}{|S|} I(S_R), \\quad I(S) = 1 - \\sum_{c \\in \\{0, 1\\}} p_c^2$$", style_math))
    story.append(Paragraph(
        "<b>Variance Reduction & Sub-15ms Speed:</b> By randomizing thresholds, tree correlation $\\rho$ drops significantly. Total ensemble variance $\\text{Var}(\\bar{f}) = \\rho \\sigma^2 + \\frac{1-\\rho}{M} \\sigma^2$ is minimized without expensive threshold-sorting algorithms, enabling sub-15ms execution during live telephone calls.",
        style_body
    ))

    # =========================================================================
    # SECTION 6: BENCHMARK RESULTS & COMPARATIVE EVALUATION
    # =========================================================================
    story.append(Paragraph("6. Dataset Composition & Benchmark Performance", style_h1))
    story.append(Paragraph(
        "<b>Dataset Composition (383 Total Audio Chunks):</b><br/>"
        "• <b>178 AI-Generated Chunks:</b> Kaggle Deepfake Voice (`birdy654/deep-voice-deepfake-voice-recognition`), ElevenLabs Neural Voice Clone v2, Google WaveNet, gTTS (English + Hindi vishing scripts), OpenAI Voice, and V2V pitch conversions.<br/>"
        "• <b>205 Authentic Human Chunks:</b> Spontaneous multi-speaker conversations across diverse genders and dialects.<br/>"
        "• <b>Partitioning:</b> 294 Training Chunks (77%) vs. 89 Unseen Testing Chunks (23%) using Stratified Splitting.",
        style_body
    ))

    benchmark_table = [
        [Paragraph("Model Architecture", style_th), Paragraph("Accuracy", style_th), Paragraph("Precision (AI)", style_th), Paragraph("Recall (AI Scams)", style_th), Paragraph("F1-Score", style_th), Paragraph("Latency", style_th)],
        [
            Paragraph("🏆 <b>ExtraTrees (CallShield)</b>", style_td),
            Paragraph("<b>88.76%</b>", style_td),
            Paragraph("<b>82.46%</b>", style_td),
            Paragraph("<b>100.00% (47/47)</b>", style_td),
            Paragraph("<b>0.9038</b>", style_td),
            Paragraph("<b>&lt; 15 ms</b>", style_td)
        ],
        [
            Paragraph("Soft Voting Ensemble", style_td),
            Paragraph("84.27%", style_td),
            Paragraph("81.13%", style_td),
            Paragraph("91.49%", style_td),
            Paragraph("0.8600", style_td),
            Paragraph("~ 35 ms", style_td)
        ],
        [
            Paragraph("Random Forest", style_td),
            Paragraph("83.15%", style_td),
            Paragraph("80.77%", style_td),
            Paragraph("89.36%", style_td),
            Paragraph("0.8485", style_td),
            Paragraph("~ 22 ms", style_td)
        ],
        [
            Paragraph("Gradient Boosting", style_td),
            Paragraph("82.02%", style_td),
            Paragraph("80.39%", style_td),
            Paragraph("87.23%", style_td),
            Paragraph("0.8367", style_td),
            Paragraph("~ 18 ms", style_td)
        ]
    ]
    t_bench = Table(benchmark_table, colWidths=[120, 65, 75, 95, 65, 92])
    t_bench.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate900),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_bench)
    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 7: AI GENERATOR ATTRIBUTION ENGINE
    # =========================================================================
    story.append(Paragraph("7. AI Generator Attribution & Forensic Fingerprinting", style_h1))
    story.append(Paragraph(
        "CallShield's attribution engine (`model_attribution_service.py`) maps acoustic spectral metrics to the exact synthesis engine:",
        style_body
    ))
    story.append(Paragraph("• <b>ElevenLabs Neural Voice Clone v2:</b> Spectral centroid $> 2800\\text{ Hz}$, pitch std $\\sigma_p < 7.0\\text{ Hz}$, cutoff cap at $20.0\\text{ kHz}$ (Diffusion TTS, 96.8% confidence).", style_bullet))
    story.append(Paragraph("• <b>Google WaveNet / gTTS:</b> Low pitch std $\\sigma_p < 4.0\\text{ Hz}$, elevated $\\text{ZCR} > 0.08$, cutoff cap at $16.0\\text{ kHz}$ (Autoregressive/Concatenative TTS, 98.5% confidence).", style_bullet))
    story.append(Paragraph("• <b>Real-Time Voice Conversion (V2V):</b> High RMS energy $> 0.04$, $\\sigma_p \\ge 8.0\\text{ Hz}$, phase discontinuity index $0.92$ (Pitch-Shift Masking, 94.2% confidence).", style_bullet))
    story.append(Paragraph("• <b>OpenAI Voice / PlayHT:</b> Transformer spectral envelope, flatness $0.82$, cutoff cap at $18.0\\text{ kHz}$ (Audio Transformer, 95.0% confidence).", style_bullet))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 8: COMPLETE API SPECIFICATION & DATABASE SCHEMA
    # =========================================================================
    story.append(Paragraph("8. Complete API Specifications & Database Schemas", style_h1))
    
    story.append(Paragraph("A. FastAPI Endpoints & Response Schema", style_h2))
    story.append(Paragraph("<b>Endpoint:</b> <code>POST /api/v1/predict</code> & <code>POST /api/v1/predict/live</code>", style_body))
    story.append(Paragraph("""{
  "predicted_label": "ai_generated",
  "ai_probability": 0.8950,
  "ai_confidence_percent": 89.5,
  "overall_risk_score": 89.5,
  "risk_level": "high",
  "warning": true,
  "attributed_generator": "ElevenLabs Neural Voice Clone v2",
  "synthesis_technique": "Neural Latent Diffusion TTS",
  "spectral_cutoff_khz": 20.0,
  "chunk_count": 4,
  "chunk_predictions": [
    {"chunk_id": "chunk_001", "start_time_seconds": 0.0, "end_time_seconds": 2.5, "predicted_label": "ai_generated", "ai_probability": 0.8840, "risk_level": "high"},
    {"chunk_id": "chunk_002", "start_time_seconds": 2.5, "end_time_seconds": 5.0, "predicted_label": "ai_generated", "ai_probability": 0.9120, "risk_level": "high"}
  ]
}""", style_code_block))

    story.append(Paragraph("B. Database Schemas (Supabase PostgreSQL)", style_h2))
    story.append(Paragraph("• <b><code>users</code> Table:</b> <code>id (SERIAL), full_name (VARCHAR), email (VARCHAR UNIQUE), password_salt (VARCHAR), password_hash (VARCHAR), auth_token (VARCHAR UNIQUE), created_at, last_login_at</code>", style_bullet))
    story.append(Paragraph("• <b><code>prediction_history</code> Table:</b> <code>id (SERIAL), filename (VARCHAR), predicted_label (VARCHAR), ai_probability (FLOAT), risk_level (VARCHAR), warning (BOOLEAN), chunk_count (INT), chunk_predictions_json (JSONB), created_at</code>", style_bullet))
    story.append(Paragraph("• <b><code>scam_blacklist</code> Table:</b> <code>phone_number (VARCHAR PRIMARY KEY), report_count (INT), source (VARCHAR), created_at</code>", style_bullet))

    # =========================================================================
    # SECTION 9: REAL-TIME TELEPHONY INTEGRATION
    # =========================================================================
    story.append(Paragraph("9. Native Android Telephony Integration & Security", style_h1))
    story.append(Paragraph(
        "CallShield's native client application interacts directly with Android's core telephony stack (`CallInterceptorModule.java`):",
        style_body
    ))
    story.append(Paragraph("1) <b>State Detection:</b> Android <code>BroadcastReceiver</code> listens to <code>PHONE_STATE</code> events and detects <code>CALL_STATE_RINGING</code>.", style_bullet))
    story.append(Paragraph("2) <b>Temporal Risk Formulation:</b> Multi-chunk call risk is aggregated dynamically: $R_{\\text{call}} = 0.55 R_{\\text{avg}} + 0.30 R_{\\text{chunk}} + 0.15 R_{\\text{max}}$.", style_bullet))
    story.append(Paragraph("3) <b>One-Tap Native Call Drop:</b> Upon High Risk verification ($R \\ge 65\\%$), the native module triggers <code>TelecomManager.endCall()</code> to drop the line.", style_bullet))
    story.append(Paragraph("4) <b>Zero-Retention Ephemeral Privacy:</b> In-memory Linux <code>/tmp</code> buffers are unlinked immediately post-prediction. No voice recordings are retained.", style_bullet))

    # =========================================================================
    # SECTION 10: JUDGE & EVALUATOR Q&A CHEAT SHEET
    # =========================================================================
    story.append(Paragraph("10. Evaluator & Conference Reviewer Q&A Reference", style_h1))
    
    qa_list = [
        (
            "Q1: Why ExtraTrees over deep neural networks (e.g., Wav2Vec 2.0 or ResNet)?",
            "Deep transformers require 300MB–1GB RAM, GPU acceleration, and introduce 300–800ms latency. ExtraTrees executes in <15ms on standard mobile/cloud CPUs, requires only 2MB memory, achieved 100% Recall (47/47 AI scams caught), and resists acoustic overfitting due to randomized threshold splits."
        ),
        (
            "Q2: How do you handle ambient room noise and cellular compression?",
            "Our dataset pipeline applies telecom-grade channel augmentation (300Hz–3400Hz 4th-order Butterworth bandpass filter and 18dB SNR noise injection). Furthermore, an RMS energy gate (min_rms = 0.0001) skips silent pauses to prevent false alarms on background noise."
        ),
        (
            "Q3: What happens if internet connectivity drops during an active call?",
            "CallShield utilizes an offline-first architecture. Blacklists and sessions are cached locally in AsyncStorage. For offline inference, the model compiles into an on-device ONNX Runtime binary (<2MB) that runs locally on the phone's CPU with zero internet requirement."
        ),
        (
            "Q4: How do you ensure user voice privacy?",
            "Audio slices sent to the backend are processed as ephemeral temporary files in Linux /tmp and immediately unlinked (deleted) post-inference. Zero raw speech recordings are persisted on cloud servers."
        )
    ]
    for q, a in qa_list:
        story.append(Paragraph(q, style_qa_q))
        story.append(Paragraph(a, style_qa_a))

    doc.build(story, canvasmaker=MasterNumberedCanvas)
    print(f"Master Specification PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    out_dir = Path(r"c:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\docs")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_pdf = out_dir / "CallShield_Master_Project_Specification_and_Implementation_Document.pdf"
    build_master_pdf(str(out_pdf))
