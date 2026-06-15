import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, RANK_COLOR } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { ProgressBar } from '@/components/ui/primitives';
import type { Dungeon } from '@/game/types';

function DungeonCard({ d }: { d: Dungeon }) {
  const openDungeon = useGame((s) => s.openDungeon);
  const rc = RANK_COLOR[d.rank];
  const done = d.floors.filter((f) => f.done).length;
  const pct = Math.round((done / d.floors.length) * 100);
  return (
    <Pressable onPress={() => openDungeon(d.id)}>
      <LinearGradient
        colors={['rgba(20,33,58,0.55)', 'rgba(8,14,26,0.6)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[styles.card, { borderColor: rc + '44' }]}
      >
        <Text style={[styles.ghostRank, { color: rc }]}>{d.rank}</Text>
        <View style={styles.cardTop}>
          <View style={[styles.rankBox, { borderColor: rc, shadowColor: rc }]}>
            <Text style={[styles.rankBoxText, { color: rc }]}>{d.rank}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.dName}>{d.name}</Text>
            <Text style={styles.dDesc}>{d.desc}</Text>
          </View>
        </View>
        <View style={{ marginTop: 13 }}>
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>
              {done} / {d.floors.length} andares
            </Text>
            <Text style={[styles.progressPct, { color: rc }]}>{pct}%</Text>
          </View>
          <ProgressBar pct={pct} color={rc} height={6} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function DungeonsScreen() {
  const insets = useSafeAreaInsets();
  const dungeons = useGame((s) => s.dungeons);
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sysLabel}>[ DUNGEONS ]</Text>
      <Text style={styles.h1}>Suas metas</Text>
      <View style={{ gap: 11 }}>
        {dungeons.map((d) => (
          <DungeonCard key={d.id} d={d} />
        ))}
        {dungeons.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyLabel}>[ NENHUMA DUNGEON ]</Text>
            <Text style={styles.emptyText}>Suas metas de longo prazo aparecerão aqui.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: 16 },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim, marginBottom: 4 },
  h1: { fontFamily: Fonts.rajBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5, marginBottom: 16 },

  card: {
    position: 'relative',
    borderRadius: 7,
    padding: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ghostRank: {
    position: 'absolute',
    top: -30,
    right: -20,
    fontFamily: Fonts.rajBold,
    fontSize: 120,
    opacity: 0.07,
    lineHeight: 120,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rankBox: {
    width: 42,
    height: 42,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.27,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  rankBoxText: { fontFamily: Fonts.rajBold, fontSize: 24 },
  dName: { fontFamily: Fonts.rajBold, fontSize: 17, color: Colors.text, letterSpacing: 0.3, lineHeight: 19 },
  dDesc: { fontFamily: Fonts.chivoRegular, fontSize: 11.5, color: '#8DA0C2', lineHeight: 16, marginTop: 3 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, color: '#8DA0C2' },
  progressPct: { fontFamily: Fonts.monoRegular, fontSize: 10 },

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
});
