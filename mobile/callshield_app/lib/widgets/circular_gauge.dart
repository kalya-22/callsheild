import 'dart:math' as math;
import 'package:flutter/material.dart';

class CircularGauge extends StatelessWidget {
  final double value; // 0 to 100
  final double size;
  final Color color;
  final String? label;
  final String? sublabel;

  const CircularGauge({
    super.key,
    required this.value,
    this.size = 160,
    required this.color,
    this.label,
    this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _GaugePainter(
              value: value,
              color: color,
              strokeWidth: 10,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (label != null)
                Text(
                  label!,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: size > 120 ? 26 : 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              if (sublabel != null)
                Text(
                  sublabel!,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.45),
                    fontSize: 11,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double value;
  final Color color;
  final double strokeWidth;

  _GaugePainter({
    required this.value,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - (strokeWidth / 2);

    // Background circle
    final bgPaint = Paint()
      ..color = Colors.white.withOpacity(0.06)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Add a glow effect
    final shadowPaint = Paint()
      ..color = color.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth + 4
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

    final double sweepAngle = 2 * math.pi * (value / 100);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      shadowPaint,
    );

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
