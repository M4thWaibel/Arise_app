import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/theme/tokens';
import { IconStatus, IconQuests, IconDungeons, IconTitles } from '@/components/ui/icons';

export type TabKey = 'status' | 'quests' | 'dungeons' | 'titles';

const ITEMS: { key: TabKey; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'status', label: 'Status', Icon: IconStatus },
  { key: 'quests', label: 'Quests', Icon: IconQuests },
  { key: 'dungeons', label: 'Dungeons', Icon: IconDungeons },
  { key: 'titles', label: 'Títulos', Icon: IconTitles },
];

export function SystemNav({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['rgba(8,12,22,0.9)', 'rgba(5,7,13,0.98)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.nav, { height: 72 + insets.bottom, paddingBottom: insets.bottom }]}
    >
      {ITEMS.map(({ key, label, Icon }) => {
        const focused = active === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={styles.item}>
            <Icon size={22} color={focused ? Colors.glow : Colors.navInactive} />
            <Text style={[styles.label, { color: focused ? Colors.text : Colors.labelDimmer }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.2)',
    zIndex: 7,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { fontFamily: Fonts.rajSemiBold, fontSize: 11, letterSpacing: 0.5 },
});
