import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { SystemNav } from '@/components/SystemNav';
import { StatusScreen } from '@/components/screens/StatusScreen';
import { QuestsScreen } from '@/components/screens/QuestsScreen';
import { DungeonsScreen } from '@/components/screens/DungeonsScreen';
import { TitlesScreen } from '@/components/screens/TitlesScreen';

export default function Main() {
  const screen = useGame((s) => s.screen);
  const go = useGame((s) => s.go);
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {screen === 'status' && <StatusScreen />}
        {screen === 'quests' && <QuestsScreen />}
        {screen === 'dungeons' && <DungeonsScreen />}
        {screen === 'titles' && <TitlesScreen />}
      </SafeAreaView>
      <SystemNav active={screen} onChange={go} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
});
