import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, ATTR_COLOR, DIFF } from '@/theme/tokens';
import { fmtHMS } from '@/game/logic';
import { useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { IconCheck, IconPlus } from '@/components/ui/icons';
import type { Quest } from '@/game/types';

function QuestRow({ q }: { q: Quest }) {
  const toggleQuest = useGame((s) => s.toggleQuest);
  const openEditHabit = useGame((s) => s.openEditHabit);
  const d = DIFF[q.diff];
  const ac = ATTR_COLOR[q.attr];
  const checkBg = q.done ? ac : 'transparent';
  const checkBorder = q.done ? ac : 'rgba(120,150,200,0.4)';
  return (
    <LinearGradient
      colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.55)']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[styles.row, { opacity: q.done ? 0.6 : 1 }]}
    >
      <Pressable
        onPress={() => toggleQuest(q.id)}
        style={[
          styles.check,
          {
            borderColor: checkBorder,
            backgroundColor: checkBg,
            shadowColor: checkBg,
            shadowOpacity: q.done ? 0.4 : 0,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {q.done && <IconCheck size={15} color={Colors.bgBase} />}
      </Pressable>
      <Pressable onPress={() => openEditHabit(q.id)} style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.qName, { color: q.done ? Colors.labelDim : Colors.text }]}>{q.name}</Text>
        <View style={styles.qMeta}>
          <Text style={[styles.attrTag, { color: ac, borderColor: ac + '66' }]}>{q.attr}</Text>
          <Text
            style={[
              styles.mTag,
              {
                color: q.mandatory ? Colors.redSofter : '#6E84A8',
                backgroundColor: q.mandatory ? 'rgba(255,45,85,0.10)' : 'rgba(120,150,200,0.07)',
              },
            ]}
          >
            {q.mandatory ? 'OBRIGATÓRIA' : 'OPCIONAL'}
          </Text>
          <Text style={styles.seq}>SEQ {q.streak}</Text>
        </View>
      </Pressable>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.xp, { color: d.color }]}>+{d.xp}</Text>
        <Text style={styles.diffLabel}>{d.label}</Text>
      </View>
    </LinearGradient>
  );
}

export function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const quests = useGame((s) => s.quests);
  const resetTarget = useGame((s) => s.resetTarget);
  const openCreate = useGame((s) => s.openCreate);

  const sorted = [...quests].sort(
    (a, b) => Number(a.done) - Number(b.done) || Number(b.mandatory) - Number(a.mandatory),
  );
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sysLabel}>[ QUESTS DIÁRIAS ]</Text>
            <Text style={styles.h1}>
              {doneCount} / {quests.length} concluídas
            </Text>
          </View>
          <View style={styles.resetBox}>
            <Text style={styles.resetLabel}>RESET EM</Text>
            <Text style={styles.resetTimer}>{fmtHMS(resetTarget - now)}</Text>
          </View>
        </View>

        <View style={{ gap: 9 }}>
          {sorted.map((q) => (
            <QuestRow key={q.id} q={q} />
          ))}
          {quests.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyLabel}>[ SEM QUESTS ]</Text>
              <Text style={styles.emptyText}>
                Nenhuma quest ativa.{'\n'}Toque em <Text style={styles.emptyPlus}>+</Text> para forjar
                um novo hábito.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={openCreate} style={[styles.fabWrap, { bottom: 84 + insets.bottom }]}>
        <LinearGradient
          colors={['#3DA9FC', '#1E6FD0']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.fab}
        >
          <IconPlus size={22} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim, marginBottom: 4 },
  h1: { fontFamily: Fonts.rajBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },
  resetBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.22)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetLabel: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 1.5, color: Colors.label, marginBottom: 2 },
  resetTimer: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.glow,
    textShadowColor: 'rgba(61,169,252,0.33)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.16)',
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qName: { fontFamily: Fonts.rajSemiBold, fontSize: 15.5, letterSpacing: 0.2, lineHeight: 18 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  attrTag: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  mTag: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  seq: { fontFamily: Fonts.monoRegular, fontSize: 9, color: '#6E84A8' },
  xp: { fontFamily: Fonts.rajBold, fontSize: 17 },
  diffLabel: { fontFamily: Fonts.monoRegular, fontSize: 8.5, color: Colors.labelDim, letterSpacing: 0.5 },

  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(61,169,252,0.25)',
    borderRadius: 8,
    backgroundColor: 'rgba(20,33,58,0.25)',
  },
  emptyLabel: { fontFamily: Fonts.monoRegular, fontSize: 11, letterSpacing: 2, color: Colors.labelDim, marginBottom: 8 },
  emptyText: { fontFamily: Fonts.chivoRegular, fontSize: 13, color: '#8DA0C2', lineHeight: 19.5, textAlign: 'center' },
  emptyPlus: { color: Colors.glow, fontFamily: Fonts.chivoBold },

  fabWrap: { position: 'absolute', right: 18, zIndex: 6 },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E6FD0',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
