import 'package:flutter/material.dart';
import '../models/prediction_result.dart';
import '../widgets/glass_card.dart';
import '../widgets/circular_gauge.dart';

class CallReportScreen extends StatelessWidget {
  final PredictionResult? historyItem;

  const CallReportScreen({super.key, this.historyItem});

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color textMuted = const Color(0x61FFFFFF);
  final Color textSec = const Color(0xA5FFFFFF);

  @override
  Widget build(BuildContext context) {
    final bool isAi = historyItem?.predictedLabel == 'ai_generated';
    final int score = historyItem?.aiPercentage ?? 78;
    final String riskLevel = historyItem?.riskLevel.toUpperCase() ?? 'SUSPICIOUS';
    final Color riskColor = _getRiskColor(historyItem?.riskLevel ?? 'medium');
    final String callerLabel = isAi ? 'AI Voice Sample' : 'Human Voice Sample';
    final String summaryText = isAi
        ? 'This sample was flagged as AI-generated with strong evidence from the playback analysis and is consistent with a high-risk call profile.'
        : 'This sample was classified as human speech and did not meet the threshold for a suspicious or scam-style call.';
    final String subtitle = historyItem?.filename ?? 'Recorded audio';
    final String detectedAt = historyItem?.createdAt ?? 'Recently reviewed';

    final List<Map<String, String>> suspiciousPhrases = isAi
        ? [
            {'phrase': 'Urgency language detected', 'time': '0:38'},
            {'phrase': 'Synthetic voice markers identified', 'time': '1:05'},
            {'phrase': 'Requested sensitive information', 'time': '1:44'},
          ]
        : [
            {'phrase': 'No decisive scam phrases detected', 'time': '0:00'},
            {'phrase': 'Speech pattern remained consistent', 'time': '0:25'},
          ];

    final List<Map<String, dynamic>> timeline = [
      {'time': '00:04', 'event': 'Call connected', 'type': 'info'},
      {'time': '00:12', 'event': 'AI detection activated', 'type': 'info'},
      {'time': '00:38', 'event': 'Synthetic voice markers detected', 'type': 'warning'},
      {'time': '01:05', 'event': 'Pressure language identified: "Act now"', 'type': 'warning'},
      {'time': '01:44', 'event': 'SSN request detected — Critical alert', 'type': 'danger'},
      {'time': '02:01', 'event': 'Scam probability exceeded 75%', 'type': 'danger'},
      {'time': '02:18', 'event': 'User ended call', 'type': 'info'},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.8),
                  radius: 1.0,
                  colors: [primaryColor.withOpacity(0.08), Colors.transparent],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context, subtitle, detectedAt, riskLevel, riskColor),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      _buildCallerScoreCard(callerLabel, subtitle, detectedAt, score, riskColor),
                      const SizedBox(height: 14),
                      _buildAiSummaryCard(summaryText),
                      const SizedBox(height: 14),
                      _buildScoreBreakdown(isAi, score, riskColor),
                      const SizedBox(height: 14),
                      _buildSuspiciousPhrases(suspiciousPhrases),
                      const SizedBox(height: 14),
                      _buildTimeline(timeline),
                      const SizedBox(height: 14),
                      _buildExportButtons(),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String subtitle, String detectedAt, String riskLevel, Color riskColor) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.06),
              side: BorderSide(color: Colors.white.withOpacity(0.1)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Call Report',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  '$subtitle · $detectedAt',
                  style: TextStyle(color: textMuted, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: riskColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: riskColor.withOpacity(0.44)),
            ),
            child: Text(
              riskLevel,
              style: TextStyle(color: riskColor, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallerScoreCard(String label, String subtitle, String detectedAt, int score, Color riskColor) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dangerColor.withOpacity(0.15),
              border: Border.all(color: dangerColor.withOpacity(0.3)),
            ),
            alignment: Alignment.center,
            child: const Text(
              '?',
              style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600)),
                Text(subtitle, style: TextStyle(color: textMuted, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(detectedAt, style: TextStyle(color: textMuted, fontSize: 12)),
              ],
            ),
          ),
          CircularGauge(value: score.toDouble(), size: 80, color: riskColor, label: score.toString(), sublabel: '%'),
        ],
      ),
    );
  }

  Widget _buildAiSummaryCard(String summaryText) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      gradient: LinearGradient(
        colors: [primaryColor.withOpacity(0.1), accentColor.withOpacity(0.05)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      border: Border.all(color: primaryColor.withOpacity(0.2)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🤖', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI-GENERATED SUMMARY',
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  summaryText,
                  style: TextStyle(color: textSec, fontSize: 13, height: 1.7),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreBreakdown(bool isAi, int score, Color riskColor) {
    final List<Map<String, dynamic>> stats = [
      {'label': 'Voice Authenticity', 'val': (100 - score).clamp(0, 100), 'color': isAi ? dangerColor : successColor},
      {'label': 'Scam Probability', 'val': score, 'color': riskColor},
      {'label': 'Deepfake Score', 'val': isAi ? (score - 10).clamp(60, 100) : 24, 'color': warningColor},
      {'label': 'Speech Confidence', 'val': isAi ? (100 - score + 10).clamp(0, 100) : 91, 'color': primaryColor},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.3,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final s = stats[index];
        return GlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s['label'], style: TextStyle(color: textMuted, fontSize: 11)),
              const Spacer(),
              Text('${s['val']}%', style: TextStyle(color: s['color'], fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: s['val'] / 100,
                  backgroundColor: Colors.white.withOpacity(0.06),
                  valueColor: AlwaysStoppedAnimation<Color>(s['color']),
                  minHeight: 3,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSuspiciousPhrases(List<Map<String, String>> phrases) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Suspicious Phrases Detected',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...phrases.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: dangerColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: dangerColor.withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: dangerColor, size: 14),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          p['phrase']!,
                          style: TextStyle(color: textSec, fontSize: 12, fontStyle: FontStyle.italic),
                        ),
                      ),
                      Text(
                        p['time']!,
                        style: TextStyle(color: textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildTimeline(List<Map<String, dynamic>> timeline) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Detection Timeline',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Stack(
            children: [
              Positioned(
                left: 19,
                top: 0,
                bottom: 0,
                child: Container(width: 1, color: Colors.white.withOpacity(0.06)),
              ),
              Column(
                children: timeline.map((e) {
                  final Color c = e['type'] == 'danger' ? dangerColor : e['type'] == 'warning' ? warningColor : accentColor;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(width: 15),
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: c,
                            boxShadow: [BoxShadow(color: c.withOpacity(0.5), blurRadius: 6)],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(e['time'], style: TextStyle(color: textMuted, fontSize: 10, fontWeight: FontWeight.w500)),
                              Text(e['event'], style: TextStyle(color: textSec, fontSize: 12, height: 1.4)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExportButtons() {
    final List<Map<String, String>> buttons = [
      {'label': 'Save', 'icon': '💾'},
      {'label': 'Share', 'icon': '📤'},
      {'label': 'Export PDF', 'icon': '📄'},
    ];

    return Row(
      children: buttons
          .map((b) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: b == buttons.last ? 0 : 10),
                  child: GlassCard(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    onTap: () {},
                    child: Column(
                      children: [
                        Text(b['icon']!, style: const TextStyle(fontSize: 18)),
                        const SizedBox(height: 4),
                        Text(b['label']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }

  Color _getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case 'high':
        return dangerColor;
      case 'medium':
        return warningColor;
      case 'low':
      default:
        return successColor;
    }
  }
}
