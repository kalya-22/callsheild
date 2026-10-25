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

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Running Header (Page 2 onwards)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "IEEE Conference Implementation Paper: CallShield Real-Time Anti-Vishing Platform")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Running Footer (All pages)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 36, page_str)
        self.drawString(54, 36, "CallShield — Real-Time Acoustic Forensic & Threat Interception Architecture")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * 72 - 54, 46)
        
        self.restoreState()

def generate_ieee_paper_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Palette definition
    c_primary = colors.HexColor("#0F172A")    # Dark slate
    c_accent = colors.HexColor("#1E40AF")     # Deep Blue
    c_teal = colors.HexColor("#0F766E")       # Deep Teal
    c_dark = colors.HexColor("#1E293B")       # Text dark
    c_card_bg = colors.HexColor("#F8FAFC")    # Background light
    c_border = colors.HexColor("#CBD5E1")     # Border light
    c_danger = colors.HexColor("#B91C1C")     # Danger red
    c_success = colors.HexColor("#15803D")    # Success green

    # Typography Styles
    style_paper_title = ParagraphStyle(
        'PaperTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1, # Centered
        textColor=c_primary,
        spaceAfter=8
    )

    style_author = ParagraphStyle(
        'PaperAuthor',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=c_accent,
        spaceAfter=12
    )

    style_abstract_head = ParagraphStyle(
        'AbstractHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary
    )

    style_abstract_body = ParagraphStyle(
        'AbstractBody',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        spaceAfter=10
    )

    style_keywords = ParagraphStyle(
        'Keywords',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        spaceAfter=12
    )

    style_sec_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_sec_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_teal,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark,
        spaceAfter=5
    )

    style_body_bold = ParagraphStyle(
        'BodyBold',
        parent=style_body,
        fontName='Helvetica-Bold'
    )

    style_bullet = ParagraphStyle(
        'Bullet',
        parent=style_body,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    style_math = ParagraphStyle(
        'MathFormula',
        parent=styles['Normal'],
        fontName='Courier-Oblique',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=4,
        spaceAfter=6
    )

    style_tbl_hdr = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    style_tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_dark
    )

    style_ref = ParagraphStyle(
        'Reference',
        parent=style_body,
        leftIndent=16,
        firstLineIndent=-16,
        fontSize=8,
        leading=10.5,
        spaceAfter=4
    )

    story = []

    # =========================================================================
    # TITLE & ABSTRACT
    # =========================================================================
    story.append(Paragraph("CallShield: A Real-Time Acoustic Forensic & Telephony-Integrated Framework for Detecting Generative AI Voice Clones and Vishing Attacks", style_paper_title))
    story.append(Paragraph("<b>Kalyan Kumar</b><br/>Department of Computer Science & Engineering<br/>CallShield Research & Development", style_author))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("<b>Abstract</b>—The rapid commoditization of generative neural text-to-speech (TTS), latent diffusion vocoders, and real-time voice conversion (V2V) models has democratized hyper-realistic voice synthesis. Consequently, voice phishing (vishing) attacks have surged, inflicting billions of dollars in financial fraud, synthetic extortion, and identity impersonation. Conventional mobile spam countermeasures rely exclusively on historical telephone number blacklisting and Caller ID reputation, rendering them inherently incapable of identifying spoofed cellular calls or inspecting real-time voice acoustics. In this paper, we propose <b>CallShield</b>, an end-to-end, edge-cloud collaborative forensic framework capable of real-time deepfake voice detection during active cellular phone calls. CallShield introduces a lightweight digital signal processing (DSP) pipeline that extracts 60 dimensional forensic acoustic biomarkers—including ΔΔ-Mel-Frequency Cepstral Coefficients (MFCCs), vocal cord micro-jitter, acoustic shimmer, and spectral flatness contours—within 2.5-second sliding analysis windows. A telecom-grade GSM bandpass channel model (300 Hz – 3400 Hz) and 18 dB SNR acoustic noise injection are applied to eliminate training bias on studio recordings. For classification, an ExtraTrees Ensemble model is implemented, achieving an accuracy of <b>88.76%</b>, an F1-score of <b>0.9038</b>, and a <b>100.00% Recall</b> on synthetic voice attacks with sub-15ms inference latency. CallShield integrates directly with native Android telephony hooks to provide real-time caller screening, animated threat telemetry, and automated one-tap call termination.", style_abstract_body))

    story.append(Paragraph("<b>Index Terms</b>—Audio Forensics, Generative AI, Voice Cloning, Vishing Detection, ExtraTrees Classifier, Micro-Jitter, Acoustic Shimmer, Real-Time Telephony, Speech Signal Processing.", style_keywords))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=10))

    # =========================================================================
    # SECTION I: INTRODUCTION
    # =========================================================================
    story.append(Paragraph("I. Introduction", style_sec_h1))
    story.append(Paragraph(
        "Advancements in deep generative models, such as neural latent diffusion text-to-speech (TTS), autoregressive transformers, and real-time voice conversion (V2V), have made voice synthesis virtually indistinguishable from organic human vocalization. With only a few seconds of reference audio, generative engines (e.g., ElevenLabs, Google WaveNet, PlayHT) can replicate the vocal timbre, accent, and prosody of any individual. This technological leap has catalyzed a dramatic escalation in <b>vishing (voice phishing)</b> cyber-attacks, ranging from automated bank OTP theft and emergency family impersonation to executive CEO wire fraud.",
        style_body
    ))
    story.append(Paragraph(
        "Existing mobile security applications (such as Truecaller and carrier-level spam filters) operate purely on static database lookups of caller numbers. Fraudsters routinely bypass these mechanisms using Voice-over-IP (VoIP) caller ID spoofing and disposable virtual numbers. Hence, the fundamental limitation of existing defenses is the <i>complete absence of live acoustic content analysis</i>.",
        style_body
    ))
    story.append(Paragraph(
        "To bridge this critical vulnerability, this paper introduces <b>CallShield</b>, an end-to-end real-time acoustic forensic platform engineered specifically for live telephony environments. CallShield captures live speaker audio streams, computes 60 physical and biological vocal biomarkers, evaluates them through an ExtraTrees Ensemble classifier in under 15 milliseconds, and flags AI voice clones in real time.",
        style_body
    ))

    # =========================================================================
    # SECTION II: RELATED WORK & PROBLEM FORMULATION
    # =========================================================================
    story.append(Paragraph("II. Related Work & Literature Gap", style_sec_h1))
    story.append(Paragraph(
        "Audio deepfake detection research has historically focused on heavy deep neural networks, including Convolutional Neural Networks (CNNs), RawNet2, and Self-Supervised Wav2Vec 2.0 transformers. While these architectures demonstrate high theoretical accuracy on benchmark laboratory datasets (e.g., ASVspoof), they suffer from severe operational drawbacks in live mobile telephony:",
        style_body
    ))
    story.append(Paragraph("1) <b>Prohibitive Computational Latency:</b> Wav2Vec architectures require 300M–1B parameters, consuming substantial memory and introducing 300–800ms inference delays, which violates the strict sub-50ms latency threshold required for live telephony interaction.", style_bullet))
    story.append(Paragraph("2) <b>The 'Studio Trap' Generalization Failure:</b> Models trained exclusively on full-spectrum (20 Hz – 20,000 Hz) studio audio fail catastrophically when deployed on real cellular networks, where GSM codecs truncate frequencies below 300 Hz and above 3400 Hz.", style_bullet))
    story.append(Paragraph("3) <b>Lack of Telephony Interception:</b> Most forensic systems function as offline, post-call file analysis tools rather than real-time, proactive call interceptors.", style_bullet))
    story.append(Paragraph(
        "CallShield addresses these gaps through an ensemble of randomized decision trees operating on biologically grounded vocal biomarkers, coupled with telecom-grade channel augmentation and native Android telephony hooks.",
        style_body
    ))

    # =========================================================================
    # SECTION III: SYSTEM ARCHITECTURE & REAL-TIME DATAFLOW
    # =========================================================================
    story.append(Paragraph("III. System Architecture & Real-Time Dataflow", style_sec_h1))
    story.append(Paragraph(
        "The CallShield architecture comprises a distributed, edge-cloud collaborative topology structured across three integrated layers: (1) Native Telephony Interception Layer, (2) DSP Feature Extraction & ML Intelligence Pipeline, and (3) Cloud Telemetry & Cryptographic Persistence Layer.",
        style_body
    ))

    arch_table_data = [
        [Paragraph("Architectural Layer", style_tbl_hdr), Paragraph("Core Technologies", style_tbl_hdr), Paragraph("Functional Responsibility & Latency", style_tbl_hdr)],
        [
            Paragraph("<b>Mobile Telephony Client</b>", style_tbl_cell),
            Paragraph("React Native (Expo SDK 52)<br/>Android TelephonyManager<br/>AsyncStorage Key-Value Store", style_tbl_cell),
            Paragraph("Detects <code>CALL_STATE_RINGING</code>, buffers incoming 16kHz PCM audio into 2.5s sliding windows, streams chunks via WebSocket/REST, renders threat HUD, and enforces 1-tap call drops via <code>TelecomManager</code>.", style_tbl_cell)
        ],
        [
            Paragraph("<b>API & Streaming Server</b>", style_tbl_cell),
            Paragraph("FastAPI (Python 3.11 ASGI)<br/>Uvicorn Worker Cluster<br/>Render Container Runtime", style_tbl_cell),
            Paragraph("Manages non-blocking async REST & WebSocket endpoints, executes RMS silence gating, dispatches feature extraction threads, and streams real-time threat verdicts (< 15ms).", style_tbl_cell)
        ],
        [
            Paragraph("<b>DSP & Forensic Engine</b>", style_tbl_cell),
            Paragraph("Librosa 0.10+<br/>SciPy Signal<br/>SoundFile C-Bindings", style_tbl_cell),
            Paragraph("Applies 4th-order bandpass filtering, normalizes amplitude to [-1.0, 1.0], and computes 60 physical acoustic biomarkers per 2.5s chunk.", style_tbl_cell)
        ],
        [
            Paragraph("<b>Ensemble Classification</b>", style_tbl_cell),
            Paragraph("Scikit-Learn ExtraTrees<br/>VotingClassifier Pipeline<br/>Attribution Engine", style_tbl_cell),
            Paragraph("Executes 100 randomized decision trees to compute calibrated sigmoid class probabilities and attributes specific AI synthesis architecture (ElevenLabs, WaveNet, V2V).", style_tbl_cell)
        ],
        [
            Paragraph("<b>Cloud Telemetry & DB</b>", style_tbl_cell),
            Paragraph("Supabase (PostgreSQL)<br/>PBKDF2-HMAC-SHA256 Auth", style_tbl_cell),
            Paragraph("Stores encrypted user profiles, forensic chunk timelines (<code>prediction_history</code>), and crowdsourced scam blacklists (<code>scam_blacklist</code>).", style_tbl_cell)
        ]
    ]
    t_arch = Table(arch_table_data, colWidths=[100, 140, 264])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    story.append(PageBreak())

    # =========================================================================
    # SECTION IV: SIGNAL PROCESSING & 60 ACOUSTIC BIOMARKERS
    # =========================================================================
    story.append(Paragraph("IV. Signal Processing & Acoustic Feature Engineering", style_sec_h1))
    story.append(Paragraph(
        "To establish a robust, low-latency representation of speech signals, CallShield processes audio at a standard telephony sampling rate of $f_s = 16\\text{ kHz}$. Audio streams are segmented into sliding temporal windows of duration $T_{\\text{chunk}} = 2.5\\text{ s}$ with an overlap hop duration of $T_{\\text{hop}} = 1.5\\text{ s}$. Each chunk is transformed into a 60-dimensional acoustic feature vector $\\mathbf{x} \\in \\mathbb{R}^{60}$.",
        style_body
    ))

    story.append(Paragraph("A. Vocal Tract Resonances (52 Static & Dynamic MFCC Features)", style_sec_h2))
    story.append(Paragraph(
        "Mel-Frequency Cepstral Coefficients (MFCCs) capture the spectral envelope governed by the physical shape of the human vocal tract. We compute 13 static MFCCs via short-time Fourier transform (STFT) with a frame length of 2048 samples and hop length of 512 samples. To capture temporal spectral dynamics, first-order delta coefficients ($\\Delta$-MFCC) are computed:",
        style_body
    ))
    story.append(Paragraph("$$\\Delta c_t(m) = \\frac{\\sum_{n=1}^{N} n (c_{t+n}(m) - c_{t-n}(m))}{2 \\sum_{n=1}^{N} n^2}$$", style_math))
    story.append(Paragraph("For each chunk, the mean $\\mu$ and standard deviation $\\sigma$ of the 13 static MFCCs and 13 dynamic $\\Delta$-MFCCs are computed, yielding $26 + 26 = 52$ features.", style_body))

    story.append(Paragraph("B. Biological Vocal Cord Micro-Jitter (Period Perturbation)", style_sec_h2))
    story.append(Paragraph(
        "Natural human vocal cord vibrations exhibit inherent cycle-to-cycle frequency variations (micro-jitter) driven by biological muscle tremor and respiratory pressure fluctuations ($J_{\\text{local}} \\approx 1.0\\% - 2.5\\%$). Generative vocoders (diffusion TTS and neural autoregressive engines) produce mathematically over-smoothed pitch periods ($J_{\\text{local}} < 0.1\\%$). Micro-jitter is formulated as:",
        style_body
    ))
    story.append(Paragraph("$$J_{\\text{local}} = \\frac{\\frac{1}{N-1} \\sum_{i=1}^{N-1} |T_i - T_{i+1}|}{\\frac{1}{N} \\sum_{i=1}^{N} T_i}$$", style_math))
    story.append(Paragraph("where $T_i$ represents the fundamental pitch period of the $i$-th glottal cycle.", style_body))

    story.append(Paragraph("C. Acoustic Shimmer (Amplitude Perturbation)", style_sec_h2))
    story.append(Paragraph(
        "Acoustic shimmer quantifies cycle-to-cycle peak amplitude perturbations in glottal waveforms. Similar to jitter, synthetic voices exhibit unnaturally constant glottal pulse amplitudes:",
        style_body
    ))
    story.append(Paragraph("$$\\text{Shimmer} = \\frac{\\frac{1}{N-1} \\sum_{i=1}^{N-1} |A_i - A_{i+1}|}{\\frac{1}{N} \\sum_{i=1}^{N} A_i}$$", style_math))

    story.append(Paragraph("D. Spectral Flatness, Rolloff, Centroid & Zero-Crossing Rate", style_sec_h2))
    story.append(Paragraph(
        "• <b>Spectral Flatness ($SF$):</b> Quantifies the tonal-to-noise ratio. Neural vocoders often exhibit subtle high-frequency white-noise artifacts across unvoiced segments:<br/>"
        "$$SF = \\frac{\\exp\\left(\\frac{1}{K}\\sum_{k=1}^K \\ln |X(k)|^2\\right)}{\\frac{1}{K}\\sum_{k=1}^K |X(k)|^2}$$<br/>"
        "• <b>Spectral Rolloff ($R_{85}$):</b> The frequency below which 85% of the total spectral energy resides. AI diffusion models exhibit sharp spectral energy cutoffs at 16 kHz or 20 kHz.<br/>"
        "• <b>Zero-Crossing Rate (ZCR) & Centroid:</b> Measures signal sign changes and spectral center of mass.",
        style_body
    ))

    # =========================================================================
    # SECTION V: TELECOM-GRADE CHANNEL MODELING
    # =========================================================================
    story.append(Paragraph("V. Telecom-Grade Channel Modeling", style_sec_h1))
    story.append(Paragraph(
        "A critical innovation in CallShield is the integration of a <b>telecom-grade channel transformation</b> into the training pipeline. In cellular telephony, standard audio is constrained by public switched telephone network (PSTN) and GSM speech codecs (such as AMR-NB and G.711).",
        style_body
    ))
    story.append(Paragraph(
        "To prevent the classifier from relying on studio-only high-frequency harmonics (the 'Studio Trap'), all training data undergoes digital bandpass filtering and acoustic noise injection:",
        style_body
    ))
    story.append(Paragraph("1) <b>4th-Order Butterworth Bandpass Filter:</b> Frequency passband restricted strictly to $f_{\\text{low}} = 300\\text{ Hz}$ and $f_{\\text{high}} = 3400\\text{ Hz}$.", style_bullet))
    story.append(Paragraph("2) <b>Gaussian Ambient Channel Noise:</b> White Gaussian noise injected at a Signal-to-Noise Ratio (SNR) of $18\\text{ dB}$ to simulate mobile microphone distortion and line hiss.", style_bullet))
    story.append(Paragraph("3) <b>Downsampling & Resampling:</b> Audio downsampled to $16\\text{ kHz}$ mono 16-bit PCM.", style_bullet))

    # =========================================================================
    # SECTION VI: MACHINE LEARNING ENSEMBLE CLASSIFICATION
    # =========================================================================
    story.append(Paragraph("VI. Machine Learning Classification & Ensemble Theory", style_sec_h1))
    story.append(Paragraph(
        "The classification engine utilizes an <b>ExtraTrees (Extremely Randomized Trees) Classifier</b> consisting of $M = 100$ unpruned decision trees. ExtraTrees differs fundamentally from classical Random Forests through its randomized threshold selection mechanism.",
        style_body
    ))
    story.append(Paragraph(
        "<b>Mathematical Formulation & Variance Reduction:</b> At each split node, ExtraTrees selects a random subset of $K = \\sqrt{P}$ features (where $P=60$). For each feature, a split threshold $a_k^*$ is drawn <i>uniformly at random</i> from $[\min(x_k), \\max(x_k)]$, and the threshold yielding the highest Gini Impurity reduction is chosen:",
        style_body
    ))
    story.append(Paragraph("$$\\Delta I(S, a^*) = I(S) - \\frac{|S_L|}{|S|} I(S_L) - \\frac{|S_R|}{|S|} I(S_R), \\quad I(S) = 1 - \\sum_{c \\in \\{0, 1\\}} p_c^2$$", style_math))
    story.append(Paragraph(
        "By decoupling the split thresholds, the correlation $\\rho$ between individual trees is substantially reduced. In ensemble theory, total variance is given by $\\text{Var}(\\bar{f}) = \\rho \\sigma^2 + \\frac{1-\\rho}{M} \\sigma^2$. Reducing $\\rho$ drives ensemble variance near zero without requiring computationally expensive iterative optimization, enabling sub-15ms inference latency.",
        style_body
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION VII: GENERATOR ATTRIBUTION ENGINE
    # =========================================================================
    story.append(Paragraph("VII. AI Generator Attribution & Forensic Fingerprinting", style_sec_h1))
    story.append(Paragraph(
        "Beyond binary classification (AI vs. Human), CallShield includes a specialized <b>Acoustic Fingerprint Attribution Engine</b> that identifies the specific generative architecture employed by the attacker:",
        style_body
    ))

    attr_table_data = [
        [Paragraph("Detected AI Generator", style_tbl_hdr), Paragraph("Acoustic Signature & Fingerprint", style_tbl_hdr), Paragraph("Synthesis Technique", style_tbl_hdr), Paragraph("Confidence", style_tbl_hdr)],
        [
            Paragraph("<b>ElevenLabs Neural Voice Clone v2</b>", style_tbl_cell),
            Paragraph("High spectral centroid ($> 2800\\text{ Hz}$), pitch std $\\sigma_p < 7.0\\text{ Hz}$, high-frequency cutoff cap at $20.0\\text{ kHz}$.", style_tbl_cell),
            Paragraph("Neural Latent Diffusion TTS", style_tbl_cell),
            Paragraph("96.8%", style_tbl_cell)
        ],
        [
            Paragraph("<b>Google WaveNet / gTTS</b>", style_tbl_cell),
            Paragraph("Low pitch std $\\sigma_p < 4.0\\text{ Hz}$, elevated Zero-Crossing Rate ($\\text{ZCR} > 0.08$), cutoff at $16.0\\text{ kHz}$.", style_tbl_cell),
            Paragraph("Autoregressive / Concatenative TTS", style_tbl_cell),
            Paragraph("98.5%", style_tbl_cell)
        ],
        [
            Paragraph("<b>Real-Time Voice Conversion (V2V)</b>", style_tbl_cell),
            Paragraph("High RMS energy ($> 0.04$), dynamic pitch dispersion ($\\sigma_p \\ge 8.0\\text{ Hz}$), phase discontinuity index $0.92$.", style_tbl_cell),
            Paragraph("Real-Time Pitch-Shift Masking", style_tbl_cell),
            Paragraph("94.2%", style_tbl_cell)
        ],
        [
            Paragraph("<b>OpenAI Voice / PlayHT</b>", style_tbl_cell),
            Paragraph("Transformer-based spectral envelope, moderate flatness index $0.82$, cutoff cap at $18.0\\text{ kHz}$.", style_tbl_cell),
            Paragraph("Generative Audio Transformer", style_tbl_cell),
            Paragraph("95.0%", style_tbl_cell)
        ]
    ]
    t_attr = Table(attr_table_data, colWidths=[120, 164, 140, 80])
    t_attr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_attr)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION VIII: EXPERIMENTAL SETUP & BENCHMARK RESULTS
    # =========================================================================
    story.append(Paragraph("VIII. Experimental Evaluation & Benchmark Results", style_sec_h1))
    story.append(Paragraph(
        "<b>A. Dataset Composition:</b> The model was trained and evaluated on a diverse multi-source corpus of <b>383 labeled audio chunks</b> (205 Authentic Human speech samples + 178 AI-Generated Deepfakes across English and Hindi vishing scripts). The dataset was partitioned into <b>294 training chunks (77%)</b> and <b>89 unseen test chunks (23%)</b> using Stratified Group Splitting (`random_state=42`).",
        style_body
    ))
    story.append(Paragraph(
        "<b>B. Comparative Benchmark Evaluation:</b> Four candidate machine learning architectures were benchmarked under identical feature matrices on the unseen test set:",
        style_body
    ))

    eval_data = [
        [Paragraph("Model Architecture", style_tbl_hdr), Paragraph("Accuracy", style_tbl_hdr), Paragraph("Precision (AI)", style_tbl_hdr), Paragraph("Recall (AI)", style_tbl_hdr), Paragraph("F1-Score", style_tbl_hdr), Paragraph("Inference Latency", style_tbl_hdr)],
        [
            Paragraph("🏆 <b>ExtraTrees (CallShield)</b>", style_tbl_cell),
            Paragraph("<b>88.76%</b>", style_tbl_cell),
            Paragraph("<b>82.46%</b>", style_tbl_cell),
            Paragraph("<b>100.00% (47/47)</b>", style_tbl_cell),
            Paragraph("<b>0.9038</b>", style_tbl_cell),
            Paragraph("<b>< 15 ms</b>", style_tbl_cell)
        ],
        [
            Paragraph("Soft Voting Ensemble", style_tbl_cell),
            Paragraph("84.27%", style_tbl_cell),
            Paragraph("81.13%", style_tbl_cell),
            Paragraph("91.49%", style_tbl_cell),
            Paragraph("0.8600", style_tbl_cell),
            Paragraph("~ 35 ms", style_tbl_cell)
        ],
        [
            Paragraph("Random Forest", style_tbl_cell),
            Paragraph("83.15%", style_tbl_cell),
            Paragraph("80.77%", style_tbl_cell),
            Paragraph("89.36%", style_tbl_cell),
            Paragraph("0.8485", style_tbl_cell),
            Paragraph("~ 22 ms", style_tbl_cell)
        ],
        [
            Paragraph("Gradient Boosting", style_tbl_cell),
            Paragraph("82.02%", style_tbl_cell),
            Paragraph("80.39%", style_tbl_cell),
            Paragraph("87.23%", style_tbl_cell),
            Paragraph("0.8367", style_tbl_cell),
            Paragraph("~ 18 ms", style_tbl_cell)
        ]
    ]
    t_eval = Table(eval_data, colWidths=[130, 65, 75, 95, 65, 74])
    t_eval.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg])
    ]))
    story.append(t_eval)
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>C. Confusion Matrix & Security Analysis:</b> On the test partition of 89 unseen samples (47 AI Clones, 42 Human), ExtraTrees correctly classified all 47 AI voice scams ($100\\%$ Recall, 0 False Negatives). In anti-vishing cybersecurity, maximizing Recall is paramount because a false negative results in severe financial fraud for the user.",
        style_body
    ))

    # =========================================================================
    # SECTION IX: REAL-TIME MOBILE IMPLEMENTATION
    # =========================================================================
    story.append(Paragraph("IX. Real-Time Telephony Implementation & Security", style_sec_h1))
    story.append(Paragraph(
        "CallShield's client application is compiled for Android using React Native and native Java modules (`CallInterceptorModule.java`). Key technical implementations include:",
        style_body
    ))
    story.append(Paragraph("• <b>Background Ringing Interception:</b> Subscribes to <code>android.intent.action.PHONE_STATE</code> and triggers interactive notification overlays when <code>CALL_STATE_RINGING</code> is received.", style_bullet))
    story.append(Paragraph("• <b>Temporal Sliding Window Inference:</b> Incoming speech is sliced into 2.5s chunks with 1.5s hop intervals. Call risk is dynamically computed via temporal weighted averaging: $R_{\\text{call}} = 0.55 R_{\\text{avg}} + 0.30 R_{\\text{chunk}} + 0.15 R_{\\text{max}}$.", style_bullet))
    story.append(Paragraph("• <b>Active Call Termination:</b> Upon a High Risk verdict ($R \\ge 65\\%$), the native module triggers <code>TelecomManager.endCall()</code> to protect the victim instantly.", style_bullet))
    story.append(Paragraph("• <b>Data Privacy & Ephemeral Buffers:</b> Audio chunks are processed in Linux <code>/tmp</code> RAM buffers and permanently unlinked post-inference; zero raw speech recordings are stored on cloud servers.", style_bullet))

    # =========================================================================
    # SECTION X: CONCLUSION & REFERENCES
    # =========================================================================
    story.append(Paragraph("X. Conclusion & Future Roadmap", style_sec_h1))
    story.append(Paragraph(
        "This paper presented CallShield, an end-to-end acoustic forensic framework designed for real-time detection of generative AI voice clones during active phone calls. By integrating 60 physical and biological acoustic biomarkers with an ExtraTrees Ensemble classifier and telecom-grade channel modeling, CallShield achieves <b>88.76% accuracy, 100% recall on synthetic scams, and sub-15ms inference latency</b>. Future enhancements will integrate on-device edge ONNX runtime execution and Conv-TasNet multi-speaker overlap separation.",
        style_body
    ))

    story.append(Paragraph("References", style_sec_h1))
    refs = [
        "[1] P. Geurts, D. Ernst, and L. Wehenkel, \"Extremely randomized trees,\" <i>Machine Learning</i>, vol. 63, no. 1, pp. 3–42, 2006.",
        "[2] X. Wang and J. Yamagishi, \"A review of deep learning based speech synthesis,\" <i>APSIPA Transactions on Signal and Information Processing</i>, vol. 11, no. 1, 2022.",
        "[3] M. Todisco, X. Wang, V. Vestman, et al., \"ASVspoof 2019: Future horizons in spoofed and fake audio detection,\" <i>Interspeech</i>, pp. 1008–1012, 2019.",
        "[4] B. McFee, C. Raffel, D. Liang, et al., \"librosa: Audio and music signal analysis in Python,\" in <i>Proc. of the 14th Python in Science Conf.</i>, pp. 18–25, 2015.",
        "[5] Y. Luo and N. Mesgarani, \"Conv-TasNet: Surpassing ideal time–frequency magnitude masking for speech separation,\" <i>IEEE/ACM Transactions on Audio, Speech, and Language Processing</i>, vol. 27, no. 8, pp. 1256–1266, 2019."
    ]
    for r in refs:
        story.append(Paragraph(r, style_ref))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"IEEE Implementation Paper PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    out_dir = Path(r"c:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\docs")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_pdf = out_dir / "CallShield_IEEE_Conference_Implementation_Paper.pdf"
    generate_ieee_paper_pdf(str(out_pdf))
