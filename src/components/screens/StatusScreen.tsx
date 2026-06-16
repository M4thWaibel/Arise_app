import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, ATTRS, RANK_COLOR, RARITY_COLOR } from '@/theme/tokens';
import { xpForLevel, xpForAttrLevel } from '@/game/logic';
import { useGame } from '@/store/gameStore';
import { BracketCorners, ProgressBar } from '@/components/ui/primitives';
import { IconStar, IconChevronRight, IconGear } from '@/components/ui/icons';

function RankRing({ rank, color }: { rank: string; color: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.rankWrap}>
      <Animated.View
        style={[styles.rankDashed, { borderColor: color, transform: [{ rotate }] }]}
      />
      <View
        style={[
          styles.rankSolid,
          {
            borderColor: color,
            shadowColor: color,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
      <Text style={[styles.rankLetter, { color, textShadowColor: color }]}>{rank}</Text>
    </View>
  );
}

function ShimmerBar({ pct }: { pct: number }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-30, 120] });
  return (
    <View style={styles.xpTrack}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 5, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#1E6FD0', '#3DA9FC', '#00C2FF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            StyleSheet.absoluteFill,
            { shadowColor: '#3DA9FC', shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
          ]}
        />
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export function StatusScreen() {
  const insets = useSafeAreaInsets();
  const s = useGame();

  const xpMax = xpForLevel(s.level);
  const rankColor = RANK_COLOR[s.hunterRank] ?? Colors.label;
  const xpPct = Math.min(100, Math.round((s.xp / xpMax) * 100));
  const physic = s.profile ? `${s.profile.age}a · ${s.profile.weight}kg` : '—';
  const hpPct = Math.min(100, 58 + s.attrs.VIT.level * 2);
  const mpPct = Math.min(100, 38 + s.attrs.INT.level * 3);
  const fatPct = 19;

  const eqT = s.titles.find((t) => t.name === s.equippedTitle);
  const equippedColor = eqT ? RARITY_COLOR[eqT.rarity] : Colors.glow;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.sysLabel}>[ JANELA DE STATUS ]</Text>
        <View style={styles.headerRight}>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
          <Pressable onPress={s.openSettings} style={styles.gearBtn}>
            <IconGear size={15} color={Colors.textSoft} />
          </Pressable>
        </View>
      </View>

      {/* HERO STATUS WINDOW */}
      <LinearGradient
        colors={['rgba(24,42,76,0.6)', 'rgba(8,14,26,0.7)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.hero}
      >
        <BracketCorners />
        <View style={styles.heroTop}>
          <View style={{ minWidth: 0, flexShrink: 1 }}>
            <Text style={styles.caçadorLabel}>CAÇADOR</Text>
            <Text style={styles.playerName}>{s.playerName}</Text>
            <View style={[styles.titleChip, { borderColor: equippedColor + '55' }]}>
              <IconStar size={11} color={equippedColor} />
              <Text style={[styles.titleChipText, { color: equippedColor }]}>{s.equippedTitle}</Text>
            </View>
          </View>
          <View style={styles.rankCol}>
            <RankRing rank={s.hunterRank} color={rankColor} />
            <Text style={styles.rankCaption}>RANK</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View>
            <Text style={styles.miniLabel}>NÍVEL</Text>
            <Text style={styles.levelValue}>{s.level}</Text>
          </View>
          <View>
            <Text style={styles.miniLabel}>FÍSICO</Text>
            <Text style={styles.physicValue}>{physic}</Text>
          </View>
        </View>

        {/* XP global */}
        <View style={{ marginTop: 16 }}>
          <View style={styles.xpHead}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpNums}>
              {s.xp} / {xpMax}
            </Text>
          </View>
          <ShimmerBar pct={xpPct} />
        </View>

        {/* HP / MP / FADIGA */}
        <View style={styles.vitalsRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vitalLabel, { color: Colors.glowCyan }]}>HP</Text>
            <ProgressBar pct={hpPct} color={Colors.glowCyan} height={5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vitalLabel, { color: Colors.purple }]}>MP</Text>
            <ProgressBar pct={mpPct} color={Colors.purple} height={5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vitalLabel, { color: Colors.redSofter }]}>FADIGA</Text>
            <ProgressBar pct={fatPct} color={Colors.redAlert} height={5} />
          </View>
        </View>
      </LinearGradient>

      {/* penalty banner */}
      {s.penalty.active && (
        <Pressable onPress={s.openPenalty}>
          <LinearGradient
            colors={['rgba(50,12,20,0.7)', 'rgba(20,6,10,0.7)']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.penaltyBanner}
          >
            <Text style={styles.penaltyBang}>!</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.penaltyTitle}>PENALIDADE PENDENTE</Text>
              <Text style={styles.penaltySub}>
                Você falhou em &quot;{s.penalty.source}&quot;. Toque para resolver.
              </Text>
            </View>
            <IconChevronRight size={13} color={Colors.redSoft} />
          </LinearGradient>
        </Pressable>
      )}

      {/* free points callout */}
      {s.freePoints > 0 && (
        <Pressable onPress={s.openDistribute}>
          <LinearGradient
            colors={['rgba(24,42,76,0.7)', 'rgba(8,14,26,0.7)']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.freeBanner}
          >
            <Text style={styles.freePlus}>+{s.freePoints}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.freeTitle}>PONTOS LIVRES</Text>
              <Text style={styles.freeSub}>Distribua nos seus atributos.</Text>
            </View>
            <Text style={styles.freeCta}>DISTRIBUIR ›</Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* attributes */}
      <LinearGradient
        colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.attrPanel}
      >
        <Text style={[styles.sysLabel, { marginBottom: 14 }]}>[ ATRIBUTOS ]</Text>
        {ATTRS.map((m) => {
          const a = s.attrs[m.key];
          const mx = xpForAttrLevel(a.level);
          const pct = Math.min(100, Math.round((a.xp / mx) * 100));
          return (
            <View key={m.key} style={{ marginBottom: 13 }}>
              <View style={styles.attrHead}>
                <View style={[styles.attrSigla, { borderColor: m.color, shadowColor: m.color }]}>
                  <Text style={[styles.attrSiglaText, { color: m.color }]}>{m.key}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.attrLabel}>{m.label}</Text>
                  <Text style={styles.attrCat}>{m.cat}</Text>
                </View>
                <Text style={[styles.attrLevel, { color: m.color }]}>Nv {a.level}</Text>
              </View>
              <ProgressBar pct={pct} color={m.color} height={6} />
            </View>
          );
        })}
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gearBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.25)',
    backgroundColor: 'rgba(20,33,58,0.4)',
  },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glow,
    shadowColor: Colors.glow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  onlineText: { fontFamily: Fonts.monoRegular, fontSize: 10, color: Colors.glow, letterSpacing: 1 },

  hero: {
    position: 'relative',
    borderRadius: 6,
    padding: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  caçadorLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.label, marginBottom: 4 },
  playerName: {
    fontFamily: Fonts.rajBold,
    fontSize: 30,
    color: Colors.text,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(61,169,252,0.35)',
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleChip: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(61,169,252,0.08)',
    borderWidth: 1,
  },
  titleChipText: { fontFamily: Fonts.rajSemiBold, fontSize: 12, letterSpacing: 0.5 },

  rankCol: { alignItems: 'center' },
  rankWrap: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  rankDashed: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  rankSolid: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2 },
  rankLetter: {
    fontFamily: Fonts.rajBold,
    fontSize: 40,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  rankCaption: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 2, color: Colors.label, marginTop: 5 },

  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.14)',
  },
  miniLabel: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 1.5, color: Colors.label },
  levelValue: { fontFamily: Fonts.rajBold, fontSize: 24, color: Colors.text },
  physicValue: { fontFamily: Fonts.rajSemiBold, fontSize: 18, color: Colors.textSoft, lineHeight: 25 },

  xpHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  xpLabel: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 2, color: Colors.label },
  xpNums: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.textSoft },
  xpTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(120,150,200,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.18)',
    overflow: 'hidden',
  },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: '40%' },

  vitalsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  vitalLabel: { fontFamily: Fonts.monoRegular, fontSize: 9, marginBottom: 4 },

  penaltyBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.5)',
  },
  penaltyBang: { fontFamily: Fonts.monoBold, fontSize: 20, color: Colors.redAlert },
  penaltyTitle: { fontFamily: Fonts.rajBold, fontSize: 15, color: Colors.redSoft, letterSpacing: 0.5 },
  penaltySub: { fontFamily: Fonts.chivoRegular, fontSize: 11.5, color: '#C29AA6' },

  freeBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.5)',
    shadowColor: Colors.glow,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  freePlus: {
    fontFamily: Fonts.rajBold,
    fontSize: 24,
    color: Colors.glow,
    textShadowColor: Colors.glow,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  freeTitle: { fontFamily: Fonts.rajBold, fontSize: 15, color: Colors.text, letterSpacing: 0.5 },
  freeSub: { fontFamily: Fonts.chivoRegular, fontSize: 11.5, color: '#8DA0C2' },
  freeCta: { fontFamily: Fonts.rajBold, fontSize: 13, color: Colors.glow, letterSpacing: 1 },

  attrPanel: {
    marginTop: 14,
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.2)',
  },
  attrHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  attrSigla: {
    width: 30,
    height: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(61,169,252,0.05)',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  attrSiglaText: { fontFamily: Fonts.monoBold, fontSize: 11 },
  attrLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.text, letterSpacing: 0.3 },
  attrCat: { fontFamily: Fonts.chivoRegular, fontSize: 10, color: Colors.labelDim },
  attrLevel: { fontFamily: Fonts.rajBold, fontSize: 17 },
});
