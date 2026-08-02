class ChunkPrediction {
  const ChunkPrediction({
    required this.chunkId,
    required this.startTimeSeconds,
    required this.endTimeSeconds,
    required this.predictedLabel,
    required this.aiProbability,
  });

  final String chunkId;
  final double startTimeSeconds;
  final double endTimeSeconds;
  final String predictedLabel;
  final double aiProbability;

  factory ChunkPrediction.fromJson(Map<String, dynamic> json) {
    return ChunkPrediction(
      chunkId: json['chunk_id'] as String,
      startTimeSeconds: (json['start_time_seconds'] as num).toDouble(),
      endTimeSeconds: (json['end_time_seconds'] as num).toDouble(),
      predictedLabel: json['predicted_label'] as String,
      aiProbability: (json['ai_probability'] as num).toDouble(),
    );
  }
}

