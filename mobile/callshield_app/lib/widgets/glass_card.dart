import 'dart:ui';
import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final double borderRadius;
  final BoxBorder? border;
  final Gradient? gradient;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.borderRadius = 20,
    this.border,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(borderRadius),
              child: Container(
                padding: padding,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withOpacity(0.75),
                  borderRadius: BorderRadius.circular(borderRadius),
                  border: border ?? Border.all(
                    color: Colors.white.withOpacity(0.08),
                    width: 1,
                  ),
                  gradient: gradient,
                ),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
