import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/theme/tokens';

// A glassy gradient surface used for most panels/cards in the HUD.
export function Surface({
  colors,
  style,
  children,
  start = { x: 0.15, y: 0 },
  end = { x: 0.6, y: 1 },
}: {
  colors?: [string, string, ...string[]];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}) {
  return (
    <LinearGradient
      colors={colors ?? ['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

// The four luminous bracket corners on the hero status window.
export function BracketCorners({ color = Colors.glow }: { color?: string }) {
  const base: ViewStyle = { position: 'absolute', width: 16, height: 16, opacity: 0.8 };
  return (
    <>
      <View style={[base, { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color }]} />
      <View style={[base, { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: color }]} />
      <View style={[base, { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: color }]} />
      <View style={[base, { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderColor: color }]} />
    </>
  );
}

// A track + glowing fill progress bar.
export function ProgressBar({
  pct,
  color,
  height = 6,
  trackBorder = false,
}: {
  pct: number;
  color: string;
  height?: number;
  trackBorder?: boolean;
}) {
  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          borderWidth: trackBorder ? 1 : 0,
          borderColor: 'rgba(61,169,252,0.18)',
        },
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, pct))}%`,
          backgroundColor: color,
          borderRadius: height / 2,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: height,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

// Bracketed mono system label e.g. "[ JANELA DE STATUS ]".
export function SystemLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sysLabel, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(120,150,200,0.12)',
    overflow: 'hidden',
    width: '100%',
  },
  sysLabel: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.labelDim,
  },
});
