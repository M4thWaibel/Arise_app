import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { fmtHMS } from '@/game/logic';
import { IconChevronLeft } from '@/components/ui/icons';

const DURATIONS = [15, 25, 50];

export function FocusGateOverlay() {
  const now = useNow();
  const focusGate = useGame((s) => s.focusGate);
  const sealedApps = useGame((s) => s.sealedApps);
  const startFocusGate = useGame((s) => s.startFocusGate);
  const endFocusGate = useGame((s) => s.endFocusGate);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const [pick, setPick] = useState(25);

  const active = focusGate?.status === 'active';
  const endAt = focusGate ? focusGate.startedAt + focusGate.durationMin * 60 * 1000 : 0;
  const remaining = endAt - now;

  // Auto-clear when the timer elapses.
  useEffect(() => {
    if (active && remaining <= 0) endFocusGate('cleared');
  }, [active, remaining, endFocusGate]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={closeOverlay} style={styles.back}>
            <IconChevronLeft size={13} color="#8DA0C2" />
            <Text style={styles.backText}>Configurações</Text>
          </Pressable>
          <Text style={styles.sysLabel}>[ GATE DE FOCO ]</Text>
          <Text style={styles.h1}>Selo voluntário</Text>
          <Text style={styles.intro}>
            Sele seus apps de distração por vontade própria. Atravesse a janela sem abri-los e ganhe
            XP de Percepção. Abrir um app selado falha o Gate.
          </Text>

          {active ? (
            <LinearGradient colors={['rgba(24,42,76,0.6)', 'rgba(8,14,26,0.7)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.activeCard}>
              <Text style={styles.activeLabel}>GATE ATIVO</Text>
              <Text style={styles.timer}>{fmtHMS(remaining)}</Text>
              <Text style={styles.activeSub}>{sealedApps.length} app(s) selado(s). Resista até o fim.</Text>
              <Pressable onPress={() => endFocusGate('failed')} style={styles.giveUp}>
                <Text style={styles.giveUpText}>DESISTIR</Text>
              </Pressable>
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.fieldLabel}>DURAÇÃO</Text>
              <View style={styles.durRow}>
                {DURATIONS.map((d) => {
                  const sel = pick === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setPick(d)}
                      style={[styles.durOpt, { backgroundColor: sel ? Colors.glow : 'rgba(61,169,252,0.05)', borderColor: sel ? Colors.glow : 'rgba(61,169,252,0.2)' }]}
                    >
                      <Text style={[styles.durText, { color: sel ? Colors.bgBase : Colors.textSoft }]}>{d} min</Text>
                    </Pressable>
                  );
                })}
              </View>
              {focusGate?.status === 'failed' && (
                <Text style={styles.failed}>[ ! ] Gate anterior falhou — você abriu um app selado.</Text>
              )}
              <Text style={styles.note}>
                {sealedApps.length > 0
                  ? `${sealedApps.length} app(s) selado(s) serão monitorados.`
                  : 'Adicione apps em Configurações → Apps Selados primeiro.'}
              </Text>
              <Pressable onPress={() => startFocusGate(pick)} disabled={sealedApps.length === 0}>
                <LinearGradient
                  colors={sealedApps.length > 0 ? ['#8B5CF6', '#6D28D9'] : ['#2A3550', '#1A2030']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.startBtn}
                >
                  <Text style={styles.startText}>INICIAR GATE</Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 37, backgroundColor: Colors.bgBase },
  scroll: { padding: 18, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { color: '#8DA0C2', fontFamily: Fonts.rajSemiBold, fontSize: 14 },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim, marginBottom: 4 },
  h1: { fontFamily: Fonts.rajBold, fontSize: 28, color: Colors.text, letterSpacing: 0.5, marginBottom: 8 },
  intro: { fontFamily: Fonts.chivoRegular, fontSize: 12.5, color: '#8DA0C2', lineHeight: 18.5, marginBottom: 18 },
  fieldLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 1.5, color: Colors.label, marginBottom: 8 },
  durRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  durOpt: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 6, borderWidth: 1 },
  durText: { fontFamily: Fonts.rajSemiBold, fontSize: 14 },
  failed: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.redSoft, marginBottom: 10 },
  note: { fontFamily: Fonts.chivoRegular, fontSize: 12, color: Colors.labelDim, marginBottom: 18, lineHeight: 17 },
  startBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 6, shadowColor: Colors.purple, shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  startText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
  activeCard: { borderRadius: 8, padding: 22, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)', alignItems: 'center' },
  activeLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.purpleLight, marginBottom: 8 },
  timer: { fontFamily: Fonts.monoBold, fontSize: 40, color: Colors.text, textShadowColor: 'rgba(139,92,246,0.5)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  activeSub: { fontFamily: Fonts.chivoRegular, fontSize: 12.5, color: '#8DA0C2', marginTop: 10, textAlign: 'center' },
  giveUp: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,45,85,0.4)' },
  giveUpText: { fontFamily: Fonts.rajSemiBold, fontSize: 14, letterSpacing: 1, color: Colors.redSoft },
});
