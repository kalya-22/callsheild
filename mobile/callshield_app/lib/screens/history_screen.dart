import 'package:flutter/material.dart';
import '../models/prediction_result.dart';
import '../services/callshield_api.dart';
import '../widgets/glass_card.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({
    required this.api,
    super.key,
  });

  final CallShieldApi api;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<PredictionResult> _items = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'All';
  String _searchQuery = '';

  final Color primaryColor = const Color(0xFF2563EB);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color textMuted = Colors.white.withOpacity(0.38);
  final Color textSec = Colors.white.withOpacity(0.65);

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final items = await widget.api.getHistory(limit: 100);
      if (mounted) {
        setState(() {
          _items = items;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleClear() async {
    try {
      await widget.api.clearHistory();
      _loadHistory();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to clear: $e')),
        );
      }
    }
  }

  List<PredictionResult> get _filteredItems {
    return _items.where((item) {
      final String riskLabel = item.warning
          ? (item.aiProbability > 0.8 ? 'Scam' : 'Suspicious')
          : 'Safe';

      final bool matchesFilter = _filter == 'All' || riskLabel == _filter;
      final bool matchesSearch = item.filename.toLowerCase().contains(_searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background glow
          Positioned(
            top: 0,
            left: 0,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: primaryColor.withOpacity(0.06),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                _buildSearchAndFilters(),
                Expanded(child: _buildHistoryList()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Call History',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          Row(
            children: [
              _buildSmallButton('Refresh', _loadHistory, textSec, Colors.white.withOpacity(0.06)),
              const SizedBox(width: 8),
              _buildSmallButton('Clear', _handleClear, dangerColor, dangerColor.withOpacity(0.1)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmallButton(String label, VoidCallback onTap, Color color, Color bg) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: color.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search prediction files...',
                hintStyle: TextStyle(color: textMuted),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 13),
              ),
            ),
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: ['All', 'Safe', 'Suspicious', 'Scam'].map((f) => _buildFilterChip(f)).toList(),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final bool isActive = _filter == label;
    final Color fColor = label == 'Safe' ? successColor : label == 'Suspicious' ? warningColor : label == 'Scam' ? dangerColor : primaryColor;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () => setState(() => _filter = label),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          decoration: BoxDecoration(
            color: isActive ? fColor.withOpacity(0.2) : Colors.white.withOpacity(0.05),
            border: Border.all(color: isActive ? fColor.withOpacity(0.5) : Colors.white.withOpacity(0.08)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? fColor : textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryList() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator(color: primaryColor));
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          child: Text(_error!, style: TextStyle(color: dangerColor, fontSize: 12)),
        ),
      );
    }

    final filtered = _filteredItems;

    if (filtered.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: GlassCard(
          padding: const EdgeInsets.all(18),
          child: Center(
            child: Text(
              'No predictions yet. Upload an audio file or start live detection.',
              textAlign: TextAlign.center,
              style: TextStyle(color: textMuted, fontSize: 13),
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 80),
      itemCount: filtered.length,
      itemBuilder: (context, index) => _buildHistoryItem(filtered[index]),
    );
  }

  Widget _buildHistoryItem(PredictionResult item) {
    final bool isAi = item.predictedLabel == 'ai_generated';
    final Color riskColor = isAi ? (item.aiProbability > 0.8 ? dangerColor : warningColor) : successColor;
    final String riskLabel = isAi ? (item.aiProbability > 0.8 ? 'Scam' : 'Suspicious') : 'Safe';
    final String title = isAi ? 'AI Voice Sample' : 'Human Voice Sample';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        onTap: () {
          // Navigate to report screen would go here
        },
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: riskColor.withOpacity(0.18),
                border: Border.all(color: riskColor.withOpacity(0.4)),
              ),
              alignment: Alignment.center,
              child: Text(
                isAi ? 'AI' : 'OK',
                style: TextStyle(color: riskColor, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: riskColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          riskLabel,
                          style: TextStyle(color: riskColor, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.filename,
                    style: TextStyle(color: textMuted, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.createdAt ?? 'Just now',
                        style: TextStyle(color: textMuted, fontSize: 11),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'AI: ${item.aiPercentage}%',
                          style: TextStyle(color: textMuted, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
