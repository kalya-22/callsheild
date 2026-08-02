import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../theme/colors';

interface CircularGaugeProps {
  value: number;
  size?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function CircularGauge({
  value,
  size = 140,
  color = C.danger,
  label,
  sublabel,
}: CircularGaugeProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (circumference * clampedValue) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress fill circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>

      <View style={styles.textOverlay}>
        <Text style={[styles.label, { fontSize: size > 120 ? 30 : 20 }]}>
          {label ?? `${clampedValue}%`}
        </Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: C.text,
    fontWeight: '800',
  },
  sublabel: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
