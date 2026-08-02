import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import '../models/prediction_result.dart';
import '../services/callshield_api.dart';
import '../widgets/glass_card.dart';
import '../widgets/waveform_painter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    required this.api,
    super.key,
  });

  final CallShieldApi api;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<PredictionResult> _history = [];
  bool _isLoading = false;
  bool _isUploading = false;
  String? _errorMessage;
  Map<String, dynamic>? _status;

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color textMuted = Colors.white.withOpacity(0.38);
  final Color textSec = Colors.white.withOpacity(0.65);

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _errorMessage = null);
    try {
      final results = await Future.wait([
        widget.api.getStatus(),
        widget.api.getHistory(limit: 4),
      ]);
      if (mounted) {
        setState(() {
          _status = results[0] as Map<String, dynamic>;
          _history = results[1] as List<PredictionResult>;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    }
  }

  Future<void> _handleFileUpload() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['wav', 'flac', 'mp3'],
      );

      if (result == null || result.files.single.path == null) return;

      setState(() {
        _isUploading = true;
        _errorMessage = null;
      });

      final file = File(result.files.single.path!);
      await widget.api.predictAudio(file);

      // Refresh history and show results (in a real app we might navigate to a report screen)
      await _loadDashboard();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Analysis complete!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool modelReady = _status?['model_ready'] == true;
    final int totalCalls = _history.length;
    final int scamCalls = _history.where((item) => item.warning).length;
    final double avgRisk = _history.isEmpty
        ? 0
        : (_history.map((e) => e.aiProbability).reduce((a, b) => a + b) / _history.length) * 100;

    return Scaffold(
      body: Stack(
        children: [
          // Background Glows
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: accentColor.withOpacity(0.07),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: primaryColor.withOpacity(0.07),
              ),
            ),
          ),

          SafeArea(
            child: RefreshIndicator(
              onRefresh: _loadDashboard,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                children: [
                  _buildHeader(),
                  const SizedBox(height: 20),
                  _buildStatusCard(modelReady),
                  const SizedBox(height: 16),
                  _buildStatsRow(totalCalls, scamCalls, avgRisk),
                  const SizedBox(height: 16),
                  _buildLiveDetectionCTA(),
                  const SizedBox(height: 20),
                  _buildUploadCard(),
                  const SizedBox(height: 24),
                  _buildRecentCallsHeader(),
                  const SizedBox(height: 14),
                  ..._history.map((call) => _buildCallItem(call)),
                  if (_history.isEmpty) _buildMockRecentCalls(),
                  const SizedBox(height: 20),
                  _buildRiskIndicator(),
                  const SizedBox(height: 80), // Space for bottom nav
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good morning,',
              style: TextStyle(color: textMuted, fontSize: 13),
            ),
            const SizedBox(height: 3),
            const Text(
              'Alex Johnson 👋',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [primaryColor, accentColor],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: primaryColor.withOpacity(0.5), width: 2),
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: const Text(
            'AJ',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard(bool modelReady) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      gradient: LinearGradient(
        colors: [
          successColor.withOpacity(0.12),
          accentColor.withOpacity(0.08),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      border: Border.all(color: successColor.withOpacity(0.25)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: successColor,
                            boxShadow: [
                              BoxShadow(color: successColor, blurRadius: 10),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          modelReady ? 'AI SHIELD ACTIVE' : 'BACKEND OFFLINE',
                          style: TextStyle(
                            color: successColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      modelReady ? 'Model Ready for Detection' : 'Start FastAPI to connect model',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _status?['database_ready'] == true
                          ? 'Database history connected'
                          : _errorMessage ?? 'Checking backend status',
                      style: TextStyle(color: textSec, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: successColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: successColor.withOpacity(0.3)),
                ),
                child: Icon(Icons.shield_outlined, color: successColor, size: 28),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Opacity(
            opacity: 0.5,
            child: WaveformWidget(
              color: successColor,
              bars: 28,
              height: 28,
              active: modelReady,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(int total, int scam, double avgRisk) {
    return Row(
      children: [
        Expanded(child: _buildStatItem('API Results', '$total', 'API', primaryColor)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatItem('Warnings', '$scam', 'AI', dangerColor)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatItem('Avg AI Risk', '${avgRisk.round()}%', '%', successColor)),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, String icon, Color color) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(color: textMuted, fontSize: 10, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveDetectionCTA() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.45),
            blurRadius: 40,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF1D4ED8),
                    primaryColor,
                    const Color(0xFF0891B2),
                  ],
                  stops: const [0, 0.4, 1],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.15),
                    ),
                    child: const Icon(Icons.mic, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Start Live Detection',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Activate AI call shield',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              top: -30,
              right: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.08),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Test Recorded Audio',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Upload wav, mp3, or flac sample',
                  style: TextStyle(color: textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: _isUploading ? null : _handleFileUpload,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.14),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: accentColor.withOpacity(0.35)),
              ),
              child: Text(
                _isUploading ? 'Checking...' : 'Upload',
                style: TextStyle(
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentCallsHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          'Recent Calls',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        TextButton(
          onPressed: () {},
          child: Text(
            'See all',
            style: TextStyle(color: primaryColor, fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Widget _buildCallItem(PredictionResult call) {
    final bool isAi = call.predictedLabel == 'ai_generated';
    final Color riskColor = isAi ? (call.aiProbability > 0.8 ? dangerColor : warningColor) : successColor;
    final String riskLabel = isAi ? (call.aiProbability > 0.8 ? 'Scam' : 'Suspicious') : 'Safe';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [riskColor.withOpacity(0.22), riskColor.withOpacity(0.11)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(color: riskColor.withOpacity(0.44)),
              ),
              alignment: Alignment.center,
              child: Text(
                isAi ? '?' : 'H',
                style: TextStyle(color: riskColor, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isAi ? 'AI Voice Sample' : 'Human Voice Sample',
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${call.filename} · ${call.createdAt ?? 'Just now'}',
                    style: TextStyle(color: textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: riskColor.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    riskLabel,
                    style: TextStyle(color: riskColor, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${call.aiPercentage}% AI',
                  style: TextStyle(color: textMuted, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMockRecentCalls() {
    final mockCalls = [
      {'name': 'HDFC Bank', 'number': '+91 22 6160 6161', 'time': '2m ago', 'risk': 'safe', 'conf': 96},
      {'name': 'Unknown Caller', 'number': '+91 98765 43210', 'time': '1h ago', 'risk': 'scam', 'conf': 91},
    ];

    return Column(
      children: mockCalls.map((call) {
        final Color rColor = call['risk'] == 'safe' ? successColor : dangerColor;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [rColor.withOpacity(0.22), rColor.withOpacity(0.11)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border.all(color: rColor.withOpacity(0.44)),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    call['name'] == 'Unknown Caller' ? '?' : call['name'].toString()[0],
                    style: TextStyle(color: rColor, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        call['name'].toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${call['number']} · ${call['time']}',
                        style: TextStyle(color: textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: rColor.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        call['risk'] == 'safe' ? 'Safe' : 'Scam',
                        style: TextStyle(color: rColor, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${call['conf']}% AI',
                      style: TextStyle(color: textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRiskIndicator() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Risk Level Today',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
              ),
              Text(
                'Low',
                style: TextStyle(color: successColor, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(3),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [successColor, accentColor]),
                    borderRadius: BorderRadius.circular(3),
                    boxShadow: [
                      BoxShadow(color: successColor.withOpacity(0.5), blurRadius: 8),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Safe', style: TextStyle(color: textMuted, fontSize: 11)),
              Text('High Risk', style: TextStyle(color: textMuted, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
