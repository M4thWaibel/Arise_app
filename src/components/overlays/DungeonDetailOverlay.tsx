import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, RANK_COLOR, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { IconChevronLeft, IconCheck } from '@/components/ui/icons';

export function DungeonDetailOverlay() {
  const activeDungeon = useGame((s) => s.activeDungeon);
  const dungeons = useGame((s) => s.dungeons);
  const toggleFloor = useGame((s) => s.toggleFloor);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const d = dungeons.find((x) => x.id === activeDungeon);
  if (!d) return null;

  const rc = RANK_COLOR[d.rank];
  const done = d.floors.filter((f) => f.done).length;
  const pct = Math.round((done / d.floors.length) * 100);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={closeOverlay} style={styles.back}>
            <IconChevronLeft size={13} color="#8DA0C2" />
            <Text style={styles.backText}>Dungeons</Text>
          </Pressable>

          <LinearGradient
            colors={['rgba(24,42,76,0.6)', 'rgba(8,14,26,0.7)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[styles.headerCard, { borderColor: rc + '55' }]}
          >
            <Text style={[styles.ghostRank, { color: rc }]}>{d.rank}</Text>
            <View>
              <View style={[styles.rankChip, { borderColor: rc }]}>
                <Text style={[styles.rankChipText, { color: rc }]}>DUNGEON · RANK {d.rank}</Text>
              </View>
              <Text style={styles.dName}>{d.name}</Text>
              <Text style={styles.dDesc}>{d.desc}</Text>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>PROGRESSO</Text>
                  <Text style={[styles.statValue, { color: rc }]}>{pct}%</Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>RECOMPENSA</Text>
                  <Text style={[styles.statValue, { color: Colors.glow }]}>+{d.xp} XP</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.floorsLabel}>[ ANDARES ]</Text>
          <View>
            {d.floors.map((f, i) => {
              const num = String(i + 1).padStart(2, '0');
              return (
                <View key={i} style={styles.floorRow}>
                  <Pressable
                    onPress={() => toggleFloor(d.id, i)}
                    style={[
                      styles.dot,
                      {
                        borderColor: f.done ? rc : 'rgba(120,150,200,0.35)',
                        backgroundColor: f.done ? rc : 'transparent',
                        shadowColor: f.done ? rc : 'transparent',
                        shadowOpacity: f.done ? 0.4 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 0 },
                      },
                    ]}
                  >
                    {f.done && <IconCheck size={14} color={Colors.bgBase} />}
                  </Pressable>
                  <View style={{ flex: 1, paddingVertical: 10 }}>
                    <Text style={styles.floorNum}>ANDAR {num}</Text>
                    <Text style={[styles.floorName, { color: f.done ? Colors.text : '#8DA0C2' }]}>{f.n}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 36, backgroundColor: Colors.bgBase },
  scroll: { padding: 18, paddingBottom: 30 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18, alignSelf: 'flex-start' },
  backText: { color: '#8DA0C2', fontFamily: Fonts.rajSemiBold, fontSize: 14 },

  headerCard: {
    position: 'relative',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  ghostRank: { position: 'absolute', top: -40, right: -15, fontFamily: Fonts.rajBold, fontSize: 160, opacity: 0.08, lineHeight: 160 },
  rankChip: { alignSelf: 'flex-start', flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  rankChipText: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 1 },
  dName: { fontFamily: Fonts.rajBold, fontSize: 27, color: Colors.text, letterSpacing: 0.5, lineHeight: 28 },
  dDesc: { fontFamily: Fonts.chivoRegular, fontSize: 13, color: '#8DA0C2', lineHeight: 19.5, marginTop: 8 },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.14)',
  },
  statLabel: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 1, color: Colors.label },
  statValue: { fontFamily: Fonts.rajBold, fontSize: 20 },

  floorsLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.labelDim, marginBottom: 12 },
  floorRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorNum: { fontFamily: Fonts.monoRegular, fontSize: 9, color: Colors.labelDim, letterSpacing: 1 },
  floorName: { fontFamily: Fonts.rajSemiBold, fontSize: 16, letterSpacing: 0.3 },
});
