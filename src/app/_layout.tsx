import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  Chivo_300Light,
  Chivo_400Regular,
  Chivo_500Medium,
  Chivo_700Bold,
} from '@expo-google-fonts/chivo';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';

import { Colors } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { Overlays } from '@/components/overlays/Overlays';
import {
  initNotifications,
  scheduleDailyReminders,
  schedulePenaltyCountdown,
  cancelPenaltyCountdown,
} from '@/services/NotificationService';
import { startAutoSync, syncNow } from '@/sync/syncEngine';
import { startHealthSync } from '@/services/health/metricQuests';
import { startGuardController } from '@/services/softlock/guardController';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    Chivo_300Light,
    Chivo_400Regular,
    Chivo_500Medium,
    Chivo_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const hydrated = useGame((s) => s.hydrated);
  const ensureFreshDay = useGame((s) => s.ensureFreshDay);
  const penaltyActive = useGame((s) => s.penalty.active);
  const penaltyDeadline = useGame((s) => s.penaltyDeadline);

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (!ready) return;
    ensureFreshDay();
    SplashScreen.hideAsync().catch(() => {});
    (async () => {
      const granted = await initNotifications();
      if (granted) await scheduleDailyReminders();
    })().catch(() => {});
    // Resume cloud sync if the user has linked an account.
    if (useGame.getState().syncAccount) {
      startAutoSync();
      void syncNow();
    }
    // Health Connect: only READ metrics (no permission prompt at launch — the
    // grant flow needs a native Activity hook that's wired separately, so we
    // never call requestPermission here). Safe no-op if HC isn't granted yet.
    startHealthSync();
    // Soft-Lock: drive the native guard from penalty/focus-gate state.
    startGuardController();
  }, [ready, ensureFreshDay]);

  // Keep the penalty countdown reminders in sync with the active penalty.
  useEffect(() => {
    if (!ready) return;
    if (penaltyActive) schedulePenaltyCountdown(penaltyDeadline).catch(() => {});
    else cancelPenaltyCountdown().catch(() => {});
  }, [ready, penaltyActive, penaltyDeadline]);

  if (!ready) {
    return <View style={styles.boot} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bgBase },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="main" />
          </Stack>
          {/* Global system overlays float above the navigator + tab bar. */}
          <Overlays />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  boot: { flex: 1, backgroundColor: Colors.bgBase },
});
