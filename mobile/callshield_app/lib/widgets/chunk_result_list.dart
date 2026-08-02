import 'package:flutter/material.dart';
import '../models/chunk_prediction.dart';

class ChunkResultList extends StatelessWidget {
  const ChunkResultList({
    required this.chunks,
    super.key,
  });

  final List<ChunkPrediction> chunks;

  @override
  Widget build(BuildContext context) {
    if (chunks.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Chunk-Level Frequency Analysis',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${chunks.length} segments',
                  style: const TextStyle(
                    color: Color(0xFF38BDF8),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          for (final chunk in chunks) _ChunkRow(chunk: chunk),
        ],
      ),
    );
  }
}

class _ChunkRow extends StatelessWidget {
  const _ChunkRow({
    required this.chunk,
  });

  final ChunkPrediction chunk;

  Color _getChunkColor(double prob) {
    if (prob > 0.7) return const Color(0xFFEF4444);
    if (prob > 0.4) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  @override
  Widget build(BuildContext context) {
    final percentage = (chunk.aiProbability * 100).round();
    final chunkColor = _getChunkColor(chunk.aiProbability);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.timer_outlined, size: 16, color: const Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  Text(
                    'Time: ${chunk.startTimeSeconds.toStringAsFixed(1)}s - ${chunk.endTimeSeconds.toStringAsFixed(1)}s',
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: chunkColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$percentage% AI',
                  style: TextStyle(
                    color: chunkColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: chunk.aiProbability,
              minHeight: 6,
              backgroundColor: const Color(0xFF334155),
              valueColor: AlwaysStoppedAnimation<Color>(chunkColor),
            ),
          ),
        ],
      ),
    );
  }
}
