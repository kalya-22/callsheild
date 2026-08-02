import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../widgets/glass_card.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _period = 'week';

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color textMuted = Colors.white.withOpacity(0.38);
  final Color textSec = Colors.white.withOpacity(0.65);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: 0,
            right: 0,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: accentColor.withOpacity(0.07),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      _buildTopStats(),
                      const SizedBox(height: 16),
                      _buildCallVolumeChart(),
                      const SizedBox(height: 14),
                      _buildDistributionAndTrendRow(),
                      const SizedBox(height: 14),
                      _buildScamCategories(),
                      const SizedBox(height: 14),
                      _buildConfidenceCard(),
                      const SizedBox(height: 100),
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

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Analytics',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Row(
              children: [
                _buildPeriodButton('week', 'This Week'),
                _buildPeriodButton('month', 'This Month'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodButton(String id, String label) {
    final bool isActive = _period == id;
    return InkWell(
      onTap: () => setState(() => _period = id),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: isActive ? LinearGradient(colors: [primaryColor, const Color(0xFF1D4ED8)]) : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : textMuted,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildTopStats() {
    return Row(
      children: [
        Expanded(child: _buildStatItem('Protected', '1,284', primaryColor)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatItem('Blocked', '47', dangerColor)),
        const SizedBox(width: 10),
        Expanded(child: _buildStatItem('Accuracy', '97.2%', successColor)),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: textMuted, fontSize: 10),
          ),
        ],
      ),
    );
  }

  Widget _buildCallVolumeChart() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Call Volume',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 150,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 40,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        if (value.toInt() >= 0 && value.toInt() < days.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(days[value.toInt()], style: TextStyle(color: textMuted, fontSize: 10)),
                          );
                        }
                        return const Text('');
                      },
                      reservedSize: 22,
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: [
                  _makeBarGroup(0, 18, 2),
                  _makeBarGroup(1, 24, 3),
                  _makeBarGroup(2, 14, 1),
                  _makeBarGroup(3, 31, 5),
                  _makeBarGroup(4, 27, 4),
                  _makeBarGroup(5, 9, 1),
                  _makeBarGroup(6, 6, 0),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem(primaryColor, 'Total Calls'),
              const SizedBox(width: 16),
              _buildLegendItem(dangerColor, 'Scams'),
            ],
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y1, double y2) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(toY: y1, color: primaryColor.withOpacity(0.7), width: 8, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
        BarChartRodData(toY: y2, color: dangerColor, width: 8, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
      ],
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: textMuted, fontSize: 11)),
      ],
    );
  }

  Widget _buildDistributionAndTrendRow() {
    return Row(
      children: [
        Expanded(child: _buildDistributionCard()),
        const SizedBox(width: 12),
        Expanded(child: _buildTrendCard()),
      ],
    );
  }

  Widget _buildDistributionCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Call Distribution',
            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 110,
            child: PieChart(
              PieChartData(
                sectionsSpace: 0,
                centerSpaceRadius: 30,
                sections: [
                  PieChartSectionData(color: successColor, value: 1184, radius: 20, showTitle: false),
                  PieChartSectionData(color: warningColor, value: 53, radius: 20, showTitle: false),
                  PieChartSectionData(color: dangerColor, value: 47, radius: 20, showTitle: false),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          _buildPieLegend(successColor, 'Safe', '1184'),
          _buildPieLegend(warningColor, 'Suspicious', '53'),
          _buildPieLegend(dangerColor, 'Scam', '47'),
        ],
      ),
    );
  }

  Widget _buildPieLegend(Color color, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Expanded(child: Text(label, style: TextStyle(color: textSec, fontSize: 10))),
          Text(value, style: TextStyle(color: textMuted, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildTrendCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'AI Accuracy Trend',
            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 110,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
                        if (value % 1 == 0 && value >= 0 && value < months.length) {
                          return Text(months[value.toInt()], style: TextStyle(color: textMuted, fontSize: 9));
                        }
                        return const Text('');
                      },
                      reservedSize: 14,
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 94),
                      FlSpot(1, 95.5),
                      FlSpot(2, 96.1),
                      FlSpot(3, 96.8),
                      FlSpot(4, 97.0),
                      FlSpot(5, 97.2),
                    ],
                    isCurved: true,
                    color: accentColor,
                    barWidth: 2,
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('↑ 3.2%', style: TextStyle(color: successColor, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(width: 4),
                Text('vs last month', style: TextStyle(color: textMuted, fontSize: 10)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScamCategories() {
    final categories = [
      {'name': 'Financial/Banking', 'count': 18, 'pct': 38},
      {'name': 'IRS/Government', 'count': 12, 'pct': 26},
      {'name': 'Tech Support', 'count': 9, 'pct': 19},
      {'name': 'Medicare/Health', 'count': 5, 'pct': 11},
      {'name': 'Lottery/Prize', 'count': 3, 'pct': 6},
    ];

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Top Scam Categories',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 14),
          ...categories.map((cat) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(cat['name'].toString(), style: TextStyle(color: textSec, fontSize: 12)),
                        Row(
                          children: [
                            Text('${cat['count']} calls', style: TextStyle(color: textMuted, fontSize: 11)),
                            const SizedBox(width: 8),
                            Text('${cat['pct']}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: Container(
                        height: 5,
                        width: double.infinity,
                        color: Colors.white.withOpacity(0.06),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: (cat['pct'] as int) / 100,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(colors: [primaryColor, accentColor]),
                              boxShadow: [BoxShadow(color: primaryColor.withOpacity(0.4), blurRadius: 4)],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildConfidenceCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('AVG AI CONFIDENCE', style: TextStyle(color: textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
              const SizedBox(height: 6),
              const Text('94.8%', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text('↑ Excellent accuracy', style: TextStyle(color: successColor, fontSize: 12)),
            ],
          ),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: successColor.withOpacity(0.15),
              border: Border.all(color: successColor.withOpacity(0.3)),
            ),
            alignment: Alignment.center,
            child: const Text('🎯', style: TextStyle(fontSize: 28)),
          ),
        ],
      ),
    );
  }
}
