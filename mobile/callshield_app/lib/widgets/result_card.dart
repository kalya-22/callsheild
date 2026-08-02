import 'package:flutter/material.dart';
import '../models/prediction_result.dart';

class ResultCard extends StatelessWidget {
  const ResultCard({
    required this.result,
    super.key,
  });

  final PredictionResult result;

  Color _getRiskColor() {
    switch (result.riskLevel.toLowerCase()) {
      case 'critical':
      case 'high':
        return const Color(0xFFEF4444); // Red
      case 'medium':
      case 'moderate':
        return const Color(0xFFF59E0B); // Amber
      default:
        return const Color(0xFF10B981); // Emerald Green
    }
  }

  IconData _getRiskIcon() {
    if (result.warning) {
      return Icons.gpp_maybe_rounded;
    }
    return Icons.verified_user_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final riskColor = _getRiskColor();
    final isHighRisk = result.warning;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: riskColor.withOpacity(0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: riskColor.withOpacity(0.12),
            blurRadius: 16,
            spreadRadius: 2,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: riskColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getRiskIcon(),
                  color: riskColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isHighRisk
                          ? 'SUSPICIOUS VISHING DETECTED'
                          : 'AUDIO APPEARS SAFE',
                      style: TextStyle(
                        color: riskColor,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      result.displayLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: riskColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: riskColor.withOpacity(0.5)),
                ),
                child: Text(
                  '${result.riskLevel.toUpperCase()} RISK',
                  style: TextStyle(
                    color: riskColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Color(0xFF334155), height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'AI Confidence Score',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              Text(
                '${result.aiPercentage}%',
                style: TextStyle(
                  color: riskColor,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: result.aiProbability,
              minHeight: 10,
              backgroundColor: const Color(0xFF334155),
              valueColor: AlwaysStoppedAnimation<Color>(riskColor),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _MetricBadge(
                  label: 'Filename',
                  value: result.filename,
                  icon: Icons.audio_file_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricBadge(
                  label: 'Audio Chunks',
                  value: '${result.chunkCount} Analyzed',
                  icon: Icons.graphic_eq,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricBadge extends StatelessWidget {
  const _MetricBadge({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF38BDF8)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
