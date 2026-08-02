import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface ShieldLogoProps {
  size?: number;
  animate?: boolean;
}

export function ShieldLogo({ size = 80, animate = false }: ShieldLogoProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, translateY]);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 110">
        <Defs>
          <LinearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </LinearGradient>
          <LinearGradient id="si" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </LinearGradient>
        </Defs>
        <Path
          d="M50 4 L88 18 L88 52 C88 78 72 96 50 107 C28 96 12 78 12 52 L12 18 Z"
          fill="url(#sg)"
        />
        <Path
          d="M50 4 L88 18 L88 52 C88 78 72 96 50 107 C28 96 12 78 12 52 L12 18 Z"
          fill="url(#si)"
        />
        <Path
          d="M33 55 L45 67 L67 41"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
