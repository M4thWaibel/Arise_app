import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, FILL, RANK_COLOR } from '@/theme/tokens';
import { useGame, DUNGEON_RANKS, DUNGEON_RANK_XP } from '@/store/gameStore';
import { IconPlus } from '@/components/ui/icons';

// Create/configure a dungeon (long-term goal) — ported from the prototype's
// CREATE DUNGEON sheet. A fresh dungeon starts with every floor open, so the
// 50/50 split XP (see completeFloor) pays out in full as the user clears it.
export function CreateDungeonOverlay() {
  const insets = useSafeAreaInsets();
  const form = useGame((s) => s.dungeonForm);
  const error = useGame((s) => s.dungeonError);
  const setName = useGame((s) => s.setDungeonName);
  const setDesc = useGame((s) => s.setDungeonDesc);
  const setRank = useGame((s) => s.setDungeonRank);
  const setFloorText = useGame((s) => s.setFloorText);
  const addFloor = useGame((s) => s.addFloor);
  const removeFloor = useGame((s) => s.removeFloor);
  const saveDungeon = useGame((s) => s.saveDungeon);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const rankXp = DUNGEON_RANK_XP[form.rank] ?? 0;

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={closeOverlay} />
      <LinearGradient
        colors={['#0B1322', '#070A12']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>Nova dungeon</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rewardXp}>+{rankXp} XP</Text>
              <Text style={styles.rewardSub}>AO LIMPAR</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>META</Text>
          <TextInput
            value={form.name}
            onChangeText={setName}
            placeholder="Ex.: Correr uma maratona"
            placeholderTextColor={Colors.label}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>DESCRIÇÃO</Text>
          <TextInput
            value={form.desc}
            onChangeText={setDesc}
            placeholder="O que define vitória?"
            placeholderTextColor={Colors.label}
            style={[styles.input, { fontSize: 14 }]}
          />

          <View style={styles.rankHead}>
            <Text style={styles.fieldLabel}>RANK</Text>
            <Text style={styles.rankHint}>E mais fácil · S mais épico</Text>
          </View>
          <View style={styles.rankRow}>
            {DUNGEON_RANKS.map((r) => {
              const active = form.rank === r;
              const rc = RANK_COLOR[r];
              return (
                <Pressable
                  key={r}
                  onPress={() => setRank(r)}
                  style={[
                    styles.rankOpt,
                    {
                      backgroundColor: active ? rc : 'rgba(61,169,252,0.05)',
                      borderColor: active ? rc : 'rgba(61,169,252,0.2)',
                    },
                  ]}
                >
                  <Text style={[styles.rankOptText, { color: active ? Colors.bgBase : Colors.textSoft }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>ANDARES (SUBTAREFAS)</Text>
          <View style={styles.floorsCol}>
            {form.floors.map((t, i) => (
              <View key={i} style={styles.floorRow}>
                <View style={styles.floorNum}>
                  <Text style={styles.floorNumText}>{String(i + 1).padStart(2, '0')}</Text>
                </View>
                <TextInput
                  value={t}
                  onChangeText={(v) => setFloorText(i, v)}
                  placeholder="Etapa desta meta"
                  placeholderTextColor={Colors.label}
                  style={styles.floorInput}
                />
                <Pressable onPress={() => removeFloor(i)} hitSlop={6} style={styles.floorRemove}>
                  <Svg width={14} height={14} viewBox="0 0 14 14">
                    <Path d="M3 3l8 8M11 3l-8 8" stroke="#6E84A8" strokeWidth={1.5} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable onPress={addFloor} style={styles.addFloor}>
            <IconPlus size={13} color={Colors.purpleLight} />
            <Text style={styles.addFloorText}>Adicionar andar</Text>
          </Pressable>

          {error && <Text style={styles.errorText}>[ ! ] Dê um nome e ao menos um andar.</Text>}

          <View style={styles.footer}>
            <Pressable onPress={closeOverlay} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </Pressable>
            <Pressable onPress={saveDungeon} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.createBtn}
              >
                <Text style={styles.createText}>ABRIR DUNGEON</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 38, justifyContent: 'flex-end' },
  backdrop: { ...FILL, backgroundColor: 'rgba(3,5,12,0.8)' },
  sheet: {
    maxHeight: '96%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,92,246,0.4)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,150,200,0.3)', alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  title: { fontFamily: Fonts.rajBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },
  rewardXp: { fontFamily: Fonts.rajBold, fontSize: 20, color: Colors.glow, lineHeight: 20 },
  rewardSub: { fontFamily: Fonts.monoRegular, fontSize: 8, letterSpacing: 1, color: Colors.label, marginTop: 2 },
  fieldLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 1.5, color: Colors.label, marginBottom: 7 },
  input: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajMedium,
    marginBottom: 16,
  },
  rankHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankHint: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: Colors.labelDim, marginBottom: 7 },
  rankRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  rankOpt: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 6, borderWidth: 1 },
  rankOptText: { fontFamily: Fonts.rajBold, fontSize: 18 },
  floorsCol: { gap: 8, marginBottom: 10 },
  floorRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  floorNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorNumText: { fontFamily: Fonts.monoRegular, fontSize: 10, color: Colors.purpleLight },
  floorInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.2)',
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.rajMedium,
  },
  floorRemove: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  addFloor: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139,92,246,0.4)',
    marginBottom: 18,
  },
  addFloorText: { fontFamily: Fonts.rajSemiBold, fontSize: 13, letterSpacing: 0.5, color: Colors.purpleLight },
  errorText: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.redSoft, marginBottom: 14 },
  footer: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
  },
  cancelText: { fontFamily: Fonts.rajSemiBold, fontSize: 15, letterSpacing: 1, color: Colors.textSoft },
  createBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    shadowColor: Colors.purple,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  createText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
});
