import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../services/callshield_api.dart';
import '../widgets/glass_card.dart';
import '../widgets/waveform_painter.dart';
import '../widgets/circular_gauge.dart';

class LiveDetectionScreen extends StatefulWidget {
  const LiveDetectionScreen({
    required this.api,
    super.key,
  });

  final CallShieldApi api;

  @override
  State<LiveDetectionScreen> createState() => _LiveDetectionScreenState();
}

class _LiveDetectionScreenState extends State<LiveDetectionScreen> with TickerProviderStateMixin {
  bool _isActive = false;
  bool _isPaused = false;
  int _seconds = 0;
  Timer? _timer;

  double _currentRisk = 0;
  int _aiChunks = 0;
  int _totalChunks = 0;
  int _overallRisk = 0;
  int _avgAiConfidence = 0;
  String _verdict = 'waiting';

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color textMuted = Colors.white.withOpacity(0.38);
  final Color textSec = Colors.white.withOpacity(0.65);

  late AnimationController _rippleController;

  @override
  void initState() {
    super.initState();
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _rippleController.dispose();
    super.dispose();
  }

  void _toggleMonitoring() {
    setState(() {
      if (!_isActive) {
        _isActive = true;
        _isPaused = false;
        _seconds = 0;
        _startTimer();
        _rippleController.repeat();
        // Reset stats
        _currentRisk = 0;
        _aiChunks = 0;
        _totalChunks = 0;
        _overallRisk = 0;
        _avgAiConfidence = 0;
        _verdict = 'waiting';
      } else {
        _isActive = false;
        _isPaused = false;
        _timer?.cancel();
        _rippleController.stop();
      }
    });
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isPaused) {
        setState(() {
          _seconds++;
          // Simulate some incoming data for UI demo
          if (_seconds % 3 == 0) {
            _totalChunks++;
            double newRisk = math.Random().nextDouble() * 100;
            _currentRisk = newRisk;
            if (newRisk > 70) _aiChunks++;
            _avgAiConfidence = ((_avgAiConfidence * (_totalChunks - 1) + newRisk) / _totalChunks).round();
            _overallRisk = (_avgAiConfidence * 0.8 + (math.Random().nextDouble() * 20)).round().clamp(0, 100);
            _verdict = _overallRisk > 60 ? 'ai_generated' : 'human';
          }
        });
      }
    });
  }

  String _formatTime(int seconds) {
    final int m = seconds ~/ 60;
    final int s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Color _getRiskColor(double risk) {
    if (risk < 35) return successColor;
    if (risk < 65) return warningColor;
    return dangerColor;
  }

  String _getRiskLabel(double risk) {
    if (risk < 35) return 'Safe';
    if (risk < 65) return 'Caution';
    return 'High Risk';
  }

  @override
  Widget build(BuildContext context) {
    final Color riskColor = _getRiskColor(_currentRisk);

    return Scaffold(
      body: Stack(
        children: [
          // Background Glow
          AnimatedContainer(
            duration: const Duration(seconds: 1),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF070E1A),
                  const Color(0xFF0F172A),
                  const Color(0xFF0A1628),
                ],
              ),
            ),
          ),
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(0, -0.2),
                    radius: 0.8,
                    colors: [riskColor, Colors.transparent],
                  ),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: [
                      _buildAvatarSection(riskColor),
                      const SizedBox(height: 10),
                      _buildTitleSection(),
                      const SizedBox(height: 20),
                      _buildWaveformCard(),
                      const SizedBox(height: 16),
                      _buildRiskMetrics(riskColor),
                      const SizedBox(height: 16),
                      _buildSummaryCard(),
                      if (_overallRisk > 60) _buildWarningCard(),
                      const SizedBox(height: 100), // Bottom space
                    ],
                  ),
                ),
              ],
            ),
          ),

          _buildBottomControls(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isActive ? dangerColor : textMuted,
                  boxShadow: _isActive ? [BoxShadow(color: dangerColor, blurRadius: 8)] : null,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _isActive ? 'LIVE' : 'READY',
                style: TextStyle(
                  color: _isActive ? dangerColor : textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _formatTime(_seconds),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 2,
              ),
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(Icons.close, color: dangerColor),
            style: IconButton.styleFrom(
              backgroundColor: dangerColor.withOpacity(0.15),
              side: BorderSide(color: dangerColor.withOpacity(0.3)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarSection(Color color) {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (_isActive && !_isPaused)
            ...List.generate(3, (i) {
              return AnimatedBuilder(
                animation: _rippleController,
                builder: (context, child) {
                  double progress = (_rippleController.value + i * 0.3) % 1.0;
                  return Container(
                    width: 72 + (progress * 70),
                    height: 72 + (progress * 70),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: color.withOpacity((1 - progress) * 0.5),
                        width: 1.5,
                      ),
                    ),
                  );
                },
              );
            }),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [color.withOpacity(0.33), color.withOpacity(0.11)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: color.withOpacity(0.66), width: 2),
              boxShadow: [
                BoxShadow(color: color.withOpacity(0.44), blurRadius: 24),
              ],
            ),
            alignment: Alignment.center,
            child: const Text(
              '?',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleSection() {
    return Column(
      children: [
        const Text(
          'Live Call Preview',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Captures audio streams to detect synthetic patterns in real time.',
          textAlign: TextAlign.center,
          style: TextStyle(color: textMuted, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildWaveformCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isActive ? (_isPaused ? 'Paused' : 'Analyzing 3-second chunks') : 'Tap Start to begin',
                style: TextStyle(color: textSec, fontSize: 12, fontWeight: FontWeight.w500),
              ),
              Text(
                '$_aiChunks/$_totalChunks AI chunks',
                style: TextStyle(color: textMuted, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 12),
          WaveformWidget(
            color: !_isActive || _isPaused ? Colors.white.withOpacity(0.2) : accentColor,
            bars: 26,
            height: 52,
            active: _isActive && !_isPaused,
          ),
        ],
      ),
    );
  }

  Widget _buildRiskMetrics(Color color) {
    return Row(
      children: [
        Expanded(
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Text(
                  'CURRENT CHUNK RISK',
                  style: TextStyle(
                    color: textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                CircularGauge(
                  value: _currentRisk,
                  size: 110,
                  color: color,
                  label: _currentRisk.round().toString(),
                  sublabel: '%',
                ),
                const SizedBox(height: 8),
                Text(
                  _isActive ? _getRiskLabel(_currentRisk) : 'Waiting',
                  style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            children: [
              _buildSmallMetricCard('Model Result', _totalChunks > 0 ? (_currentRisk > 50 ? 'ai_generated' : 'human') : 'No analysis yet', accentColor),
              const SizedBox(height: 10),
              _buildSmallMetricCard('Overall Call Risk', '$_overallRisk%', Colors.white, subValue: 'Avg AI: $_avgAiConfidence%'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSmallMetricCard(String title, String value, Color valueColor, {String? subValue}) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyle(color: textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(color: valueColor, fontSize: value.length > 10 ? 12 : 18, fontWeight: FontWeight.bold),
          ),
          if (subValue != null) ...[
            const SizedBox(height: 4),
            Text(subValue, style: TextStyle(color: textMuted, fontSize: 11)),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSummaryItem('AI Chunks', '$_aiChunks/$_totalChunks'),
              _buildSummaryItem('Avg AI', '$_avgAiConfidence%'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSummaryItem('Overall Risk', '$_overallRisk%'),
              _buildSummaryItem('Verdict', _verdict, color: _verdict == 'ai_generated' ? dangerColor : successColor),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, {Color? color}) {
    return Row(
      children: [
        Text('$label: ', style: TextStyle(color: textSec, fontSize: 11)),
        Text(value, style: TextStyle(color: color ?? Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildWarningCard() {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        border: Border.all(color: dangerColor.withOpacity(0.3)),
        gradient: LinearGradient(colors: [dangerColor.withOpacity(0.1), Colors.transparent]),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Warning: overall call risk indicates possible AI-generated voice',
                style: TextStyle(color: dangerColor, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 10),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: dangerColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('View', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 30),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF070E1A).withOpacity(0),
              const Color(0xFF070E1A).withOpacity(0.98),
            ],
            stops: const [0, 0.28],
          ),
        ),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: (_isActive || _totalChunks > 0) ? _toggleMonitoring : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: dangerColor,
                foregroundColor: Colors.white,
                disabledBackgroundColor: dangerColor.withOpacity(0.55),
                minimumSize: const Size(double.infinity, 54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 8,
                shadowColor: dangerColor.withOpacity(0.35),
              ),
              child: const Text('Stop Monitoring', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (!_isActive) {
                        _toggleMonitoring();
                      } else {
                        setState(() => _isPaused = !_isPaused);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isActive ? Colors.white.withOpacity(0.07) : null,
                      foregroundColor: Colors.white,
                      flexibleAndTrue: true, // Custom flag or just ignore
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: _isActive ? BorderSide(color: Colors.white.withOpacity(0.1)) : BorderSide.none,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: _isActive ? 0 : 4,
                    ).copyWith(
                      backgroundColor: MaterialStateProperty.resolveWith((states) {
                        if (!_isActive) return null; // Use theme/gradient
                        return Colors.white.withOpacity(0.07);
                      }),
                    ),
                    child: Ink(
                      decoration: !_isActive ? BoxDecoration(
                        gradient: LinearGradient(colors: [primaryColor, accentColor]),
                        borderRadius: BorderRadius.circular(14),
                      ) : null,
                      child: Container(
                        alignment: Alignment.center,
                        child: Text(
                          _isActive ? (_isPaused ? 'Resume' : 'Pause') : 'Start Mic',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.07),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(color: Colors.white.withOpacity(0.12)),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                    child: const Text('View Analysis', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
