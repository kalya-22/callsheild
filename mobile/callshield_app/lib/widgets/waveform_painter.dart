import 'dart:math' as math;
import 'package:flutter/material.dart';

class WaveformWidget extends StatefulWidget {
  final Color color;
  final int bars;
  final bool active;
  final double height;

  const WaveformWidget({
    super.key,
    this.color = const Color(0xFF2563EB),
    this.bars = 22,
    this.active = true,
    this.height = 56,
  });

  @override
  State<WaveformWidget> createState() => _WaveformWidgetState();
}

class _WaveformWidgetState extends State<WaveformWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    if (widget.active) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(WaveformWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.active && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return SizedBox(
          height: widget.height,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: List.generate(widget.bars, (i) {
              final double baseHeight = 0.18 + (math.sin(i * 0.75).abs() * 0.75);
              double animationValue = 1.0;

              if (widget.active) {
                final double phase = (i * 0.04 * math.pi * 2);
                animationValue = 0.7 + (math.sin(_controller.value * math.pi * 2 + phase).abs() * 0.3);
              }

              return Container(
                width: 3,
                height: widget.height * baseHeight * animationValue,
                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      widget.color,
                      widget.color.withOpacity(0.4),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              );
            }),
          ),
        );
      },
    );
  }
}
