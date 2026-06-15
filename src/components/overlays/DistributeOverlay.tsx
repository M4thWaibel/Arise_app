import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, ATTRS, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';

export function DistributeOverlay() {
  const insets = useSafeAreaInsets();
  const attrs = useGame((s) => s.attrs);
  const alloc = useGame((s) => s.alloc);
  const freePoints = useGame((s) => s.freePoints);
  const alloc_ = useGame((s) => s.alloc_);
  const confirmDistribute = useGame((s) => s.confirmDistribute);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const used = Object.values(alloc).reduce((a, b) => a + b, 0);
  const remaining = freePoints - used;

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={closeOverlay} />
      <LinearGradient
        colors={['#0B1322', '#070A12']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}
      >
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Distribuir pontos</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.remaining}>{remaining}</Text>
            <Text style={styles.remainingLabel}>RESTANTES</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Cada ponto eleva o atributo em um nível.</Text>

        <View style={{ gap: 11, marginBottom: 18 }}>
          {ATTRS.map((m) => {
            const a = attrs[m.key];
            const allocVal = alloc[m.key];
            const proj = a.level + allocVal;
            return (
              <View key={m.key} style={[styles.attrRow, { borderColor: m.color + '33' }]}>
                <View style={[styles.sigla, { borderColor: m.color }]}>
                  <Text style={[styles.siglaText, { color: m.color }]}>{m.key}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attrLabel}>{m.label}</Text>
                  <Text style={styles.attrLevel}>
                    <Text style={{ color: allocVal > 0 ? m.color : Colors.labelDim }}>Nv {proj} </Text>
                    <Text style={{ color: Colors.labelDim }}>(+{allocVal})</Text>
                  </Text>
                </View>
                <View style={styles.steppers}>
                  <Pressable onPress={() => alloc_(m.key, -1)} style={styles.dec}>
                    <Text style={styles.decText}>−</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => alloc_(m.key, 1)}
                    style={[styles.inc, { backgroundColor: m.color, shadowColor: m.color }]}
                  >
                    <Text style={styles.incText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={closeOverlay} style={styles.laterBtn}>
            <Text style={styles.laterText}>DEPOIS</Text>
          </Pressable>
          <Pressable onPress={confirmDistribute} style={{ flex: 1 }}>
            <LinearGradient
              colors={['#3DA9FC', '#1E6FD0']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmText}>CONFIRMAR</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 38, justifyContent: 'flex-end' },
  backdrop: { ...FILL, backgroundColor: 'rgba(3,5,12,0.8)' },
  sheet: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.35)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,150,200,0.3)', alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontFamily: Fonts.rajBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },
  remaining: { fontFamily: Fonts.rajBold, fontSize: 24, color: Colors.glow },
  remainingLabel: { fontFamily: Fonts.monoRegular, fontSize: 8, letterSpacing: 1, color: Colors.label },
  subtitle: { fontFamily: Fonts.chivoRegular, fontSize: 12, color: '#8DA0C2', marginBottom: 16 },

  attrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    paddingHorizontal: 13,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
  },
  sigla: { width: 30, height: 30, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  siglaText: { fontFamily: Fonts.monoBold, fontSize: 11 },
  attrLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.text },
  attrLevel: { fontFamily: Fonts.monoRegular, fontSize: 11 },
  steppers: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dec: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(120,150,200,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decText: { color: Colors.textSoft, fontSize: 20, fontFamily: Fonts.chivoLight },
  inc: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  incText: { color: Colors.bgBase, fontSize: 20, fontFamily: Fonts.chivoMedium },

  footer: { flexDirection: 'row', gap: 10 },
  laterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
  },
  laterText: { fontFamily: Fonts.rajSemiBold, fontSize: 15, letterSpacing: 1, color: Colors.textSoft },
  confirmBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    shadowColor: Colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  confirmText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
});
