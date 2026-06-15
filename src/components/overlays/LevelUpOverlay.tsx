import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';

const BURST_COLORS = ['#3DA9FC', '#00C2FF', '#8B5CF6', '#C084FC', '#E6F1FF'];

function Burst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 24 + (i % 3) * 0.18;
        const d = 70 + ((i * 13) % 130);
        return {
          tx: Math.cos(a) * d,
          ty: Math.sin(a) * d,
          s: 3 + (i % 4) * 1.4,
          color: BURST_COLORS[i % BURST_COLORS.length],
        };
      }),
    [],
  );
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(p, {
      toValue: 1,
      duration: 1150,
      easing: Easing.bezier(0.15, 0.7, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [p]);
  return (
    <View pointerEvents="none" style={styles.burstWrap}>
      {particles.map((pt, i) => {
        const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [0, pt.tx] });
        const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [0, pt.ty] });
        const scale = p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        const opacity = p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: pt.s,
              height: pt.s,
              borderRadius: pt.s / 2,
              backgroundColor: pt.color,
              shadowColor: pt.color,
              shadowOpacity: 0.9,
              shadowRadius: 9,
              shadowOffset: { width: 0, height: 0 },
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}

export function LevelUpOverlay() {
  const levelUp = useGame((s) => s.levelUp);
  const info = useGame((s) => s.levelUpInfo);
  const afterLevelUp = useGame((s) => s.afterLevelUp);

  const flash = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const spacing = useRef(new Animated.Value(24)).current;
  const footer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!levelUp) return;
    flash.setValue(0);
    scale.setValue(0.6);
    spacing.setValue(24);
    footer.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 1000, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }),
      Animated.timing(spacing, { toValue: 8, duration: 1000, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }),
    ]).start();
    Animated.timing(footer, { toValue: 1, duration: 800, delay: 500, useNativeDriver: true }).start();
  }, [levelUp, flash, scale, spacing, footer]);

  if (!levelUp || !info) return null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(20,50,110,0.85)', 'rgba(5,7,13,0.96)']}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glow, opacity: flash }]} />
      <Burst />
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Text style={styles.sysTag}>[ SISTEMA ]</Text>
        <Animated.Text style={[styles.levelUp, { letterSpacing: spacing }]}>LEVEL UP</Animated.Text>
        <Text style={styles.levelN}>Nível {info.newLevel}</Text>
      </Animated.View>
      <Animated.View style={[styles.footer, { opacity: footer }]}>
        <View style={styles.pointsChip}>
          <Text style={styles.pointsPlus}>+{info.gainedPoints}</Text>
          <Text style={styles.pointsLabel}>pontos livres</Text>
        </View>
        <Pressable onPress={afterLevelUp}>
          <LinearGradient
            colors={['#3DA9FC', '#1E6FD0']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueText}>CONTINUAR</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 40, alignItems: 'center', justifyContent: 'center' },
  burstWrap: { ...FILL, alignItems: 'center', justifyContent: 'center' },
  sysTag: { fontFamily: Fonts.monoRegular, fontSize: 12, letterSpacing: 4, color: '#9FD0FF', marginBottom: 8 },
  levelUp: {
    fontFamily: Fonts.rajBold,
    fontSize: 50,
    color: Colors.text,
    textShadowColor: '#3DA9FC',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
  },
  levelN: { fontFamily: Fonts.rajBold, fontSize: 22, color: Colors.glow, marginTop: 6 },
  footer: { marginTop: 26, alignItems: 'center', gap: 14 },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(61,169,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.5)',
  },
  pointsPlus: { fontFamily: Fonts.rajBold, fontSize: 18, color: Colors.text },
  pointsLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 14, color: Colors.textSoft, letterSpacing: 0.5 },
  continueBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 6,
    shadowColor: Colors.glow,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  continueText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
});
