import 'chunk_prediction.dart';

class PredictionResult {
  const PredictionResult({
    required this.filename,
    required this.predictedLabel,
    required this.aiProbability,
    required this.riskLevel,
    required this.warning,
    required this.chunkCount,
    required this.chunkPredictions,
    this.predictionId,
    this.createdAt,
  });

  final int? predictionId;
  final String filename;
  final String predictedLabel;
  final double aiProbability;
  final String riskLevel;
  final bool warning;
  final int chunkCount;
  final String? createdAt;
  final List<ChunkPrediction> chunkPredictions;

  factory PredictionResult.fromJson(Map<String, dynamic> json) {
    final chunks = json['chunk_predictions'] as List<dynamic>? ?? [];

    return PredictionResult(
      predictionId: json['prediction_id'] as int?,
      filename: json['filename'] as String,
      predictedLabel: json['predicted_label'] as String,
      aiProbability: (json['ai_probability'] as num).toDouble(),
      riskLevel: json['risk_level'] as String,
      warning: json['warning'] as bool,
      chunkCount: json['chunk_count'] as int,
      createdAt: json['created_at'] as String?,
      chunkPredictions: chunks
          .map((item) => ChunkPrediction.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  int get aiPercentage => (aiProbability * 100).round();

  String get displayLabel {
    return predictedLabel == 'ai_generated' ? 'AI-generated voice' : 'Human voice';
  }
}

