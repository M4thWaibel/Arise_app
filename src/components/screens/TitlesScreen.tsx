import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, RARITY_COLOR } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import type { Title } from '@/game/types';

function TitleCard({ t }: { t: Title }) {
  const c = RARITY_COLOR[t.rarity];
  const cardBorder = t.unlocked ? c : 'rgba(120,150,200,0.16)';
  const iconColor = t.unlocked ? c : '#3A4A66';
  const nameColor = t.unlocked ? Colors.text : '#6E84A8';
  const statusText = t.unlocked ? 'DESBLOQUEADO' : t.progress || 'BLOQUEADO';
  const statusColor = t.unlocked ? c : '#6E84A8';
  const legendaryGlow = t.unlocked && t.rarity === 'lendário';
  return (
    <LinearGradient
      colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[
        styles.card,
        {
          borderColor: cardBorder,
          opacity: t.unlocked ? 1 : 0.82,
          shadowColor: legendaryGlow ? c : 'transparent',
          shadowOpacity: legendaryGlow ? 0.4 : 0,
          shadowRadius: legendaryGlow ? 26 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: legendaryGlow ? 8 : 0,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <View style={[styles.iconBox, { borderColor: iconColor }]}>
          <View style={[styles.diamond, { backgroundColor: iconColor, shadowColor: iconColor }]} />
        </View>
        <Text style={[styles.rarTag, { color: c, borderColor: c + '55' }]}>{t.rarity.toUpperCase()}</Text>
      </View>
      <Text style={[styles.tName, { color: nameColor }]}>{t.name}</Text>
      <Text style={styles.tDesc}>{t.desc}</Text>
      <Text style={[styles.tStatus, { color: statusColor }]}>{statusText}</Text>
    </LinearGradient>
  );
}

export function TitlesScreen() {
  const insets = useSafeAreaInsets();
  const titles = useGame((s) => s.titles);
  const unlocked = titles.filter((t) => t.unlocked).length;
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.sysLabel}>[ TÍTULOS & CONQUISTAS ]</Text>
          <Text style={styles.h1}>Conquistas</Text>
        </View>
        <Text style={styles.counter}>
          {unlocked} / {titles.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {titles.map((t) => (
          <View key={t.id} style={styles.cell}>
            <TitleCard t={t} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim, marginBottom: 4 },
  h1: { fontFamily: Fonts.rajBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },
  counter: { fontFamily: Fonts.monoRegular, fontSize: 12, color: Colors.glow },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '50%', paddingHorizontal: 5, marginBottom: 10 },
  card: {
    borderRadius: 7,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    minHeight: 128,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 13,
    height: 13,
    transform: [{ rotate: '45deg' }],
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  rarTag: {
    fontFamily: Fonts.monoRegular,
    fontSize: 8,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  tName: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 0.3, lineHeight: 17 },
  tDesc: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: '#8DA0C2', lineHeight: 15.4, flex: 1 },
  tStatus: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 0.5 },
});
