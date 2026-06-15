import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { fmtHMS } from '@/game/logic';
import { useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { IconWarning } from '@/components/ui/icons';

function usePulse() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

export function PenaltyOverlay() {
  const now = useNow();
  const penalty = useGame((s) => s.penalty);
  const penaltyDeadline = useGame((s) => s.penaltyDeadline);
  const clearPenalty = useGame((s) => s.clearPenalty);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const vign = usePulse();
  const vignOpacity = vign.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2A0810', '#0A0306']}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.vignette, { opacity: vignOpacity }]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <Text style={styles.alertTag}>[ ALERTA DO SISTEMA ]</Text>
            <Text style={styles.bigTitle}>PENALIDADE</Text>
            <Text style={styles.subtitle}>
              Você não cumpriu <Text style={styles.subStrong}>&quot;{penalty.source}&quot;</Text>. O Sistema
              impõe uma quest de recuperação.
            </Text>
          </View>

          <View style={styles.questBox}>
            <View style={styles.questBoxHead}>
              <Text style={styles.penaltyQuestLabel}>[ PENALTY QUEST ]</Text>
              <Text style={styles.timer}>{fmtHMS(penaltyDeadline - now)}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {penalty.tasks.map((task, i) => (
                <View key={i} style={styles.taskRow}>
                  <View style={styles.taskDiamond} />
                  <Text style={styles.taskText}>{task}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.lossNote}>
            <IconWarning size={16} color={Colors.redSoft} />
            <Text style={styles.lossText}>{penalty.loss}</Text>
          </View>

          {penalty.violations > 0 && (
            <View style={styles.violationNote}>
              <Text style={styles.violationText}>
                [ ! ] {penalty.violations} infração(ões) de app selado · debuff agravado para −
                {penalty.debuffPct}% · prazo estendido.
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable onPress={closeOverlay} style={styles.laterBtn}>
              <Text style={styles.laterText}>DEPOIS</Text>
            </Pressable>
            <Pressable onPress={clearPenalty} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#FF2D55', '#C20D2E']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>LIMPAR PENALIDADE</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 39, backgroundColor: '#0A0306' },
  vignette: {
    ...FILL,
    borderWidth: 30,
    borderColor: 'rgba(255,45,85,0.4)',
    borderRadius: 1,
  },
  scroll: { padding: 24, paddingTop: 16, flexGrow: 1 },
  head: { alignItems: 'center', marginBottom: 24 },
  alertTag: { fontFamily: Fonts.monoRegular, fontSize: 11, letterSpacing: 4, color: Colors.redSoft, marginBottom: 10 },
  bigTitle: {
    fontFamily: Fonts.rajBold,
    fontSize: 42,
    color: Colors.redAlert,
    letterSpacing: 3,
    textShadowColor: 'rgba(255,45,85,0.7)',
    textShadowRadius: 26,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: { marginTop: 12, fontFamily: Fonts.chivoRegular, fontSize: 13.5, color: '#D4A8B2', lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  subStrong: { color: '#FF8A9A', fontFamily: Fonts.chivoBold },

  questBox: {
    borderRadius: 7,
    padding: 18,
    backgroundColor: 'rgba(40,8,14,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.45)',
    marginBottom: 16,
  },
  questBoxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  penaltyQuestLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.redSoft },
  timer: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.redAlert },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  taskDiamond: {
    width: 7,
    height: 7,
    backgroundColor: Colors.redAlert,
    transform: [{ rotate: '45deg' }],
    shadowColor: Colors.redAlert,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  taskText: { fontFamily: Fonts.rajMedium, fontSize: 15, color: '#F0D4D9', letterSpacing: 0.3 },

  lossNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(40,8,14,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.25)',
    marginBottom: 'auto',
  },
  lossText: { flex: 1, fontFamily: Fonts.chivoRegular, fontSize: 12, color: '#C29AA6' },
  violationNote: {
    marginTop: 10,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,45,85,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.4)',
  },
  violationText: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.redSoft, lineHeight: 16 },

  footer: { flexDirection: 'row', gap: 10, marginTop: 20 },
  laterBtn: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.3)',
  },
  laterText: { fontFamily: Fonts.rajSemiBold, fontSize: 15, letterSpacing: 1, color: '#C29AA6' },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 6,
    shadowColor: Colors.redAlert,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  clearText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
});
