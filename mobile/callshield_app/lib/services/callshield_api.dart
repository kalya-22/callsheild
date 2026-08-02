import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/prediction_result.dart';

class CallShieldApi {
  CallShieldApi({
    String? baseUrl,
  }) : baseUrl = baseUrl ?? _defaultBaseUrl;

  static String get _defaultBaseUrl {
    // 10.0.2.2 is Android emulator host loopback, 127.0.0.1 for desktop/web
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  String baseUrl;

  Future<Map<String, dynamic>> getStatus() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/status')).timeout(
            const Duration(seconds: 5),
          );
      if (response.statusCode != 200) {
        throw Exception('Status error: HTTP ${response.statusCode}');
      }
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to connect to backend: $e');
    }
  }

  Future<PredictionResult> predictAudio(File audioFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/predict'),
    );

    request.files.add(
      await http.MultipartFile.fromPath('file', audioFile.path),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200) {
      throw Exception('Prediction failed: ${response.body}');
    }

    return PredictionResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<PredictionResult> predictAudioBytes(
    List<int> bytes,
    String filename,
  ) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/predict'),
    );

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200) {
      throw Exception('Prediction failed: ${response.body}');
    }

    return PredictionResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<PredictionResult>> getHistory({int limit = 20}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/history?limit=$limit'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load history');
    }

    final List<dynamic> list = jsonDecode(response.body) as List<dynamic>;
    return list
        .map((item) => PredictionResult.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<bool> deleteHistoryItem(int predictionId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/history/$predictionId'),
    );
    return response.statusCode == 200;
  }

  Future<bool> clearHistory() async {
    final response = await http.delete(
      Uri.parse('$baseUrl/history'),
    );
    return response.statusCode == 200;
  }
}
