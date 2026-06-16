// App-side widget bridge: snapshot the current game state, persist it for the
// headless task, and push a live update to any on-screen widgets.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { useGame } from '@/store/gameStore';
import { xpForLevel } from '@/game/logic';
import { RANK_COLOR } from '@/theme/tokens';
import { WIDGET_NAMES, WIDGET_STORAGE_KEY, type WidgetData } from './types';
import { renderArise } from './components';

export function buildWidgetData(): WidgetData {
  const s = useGame.getState();
  const xpMax = xpForLevel(s.level);
  const total = s.quests.length;
  const done = s.quests.filter((q) => q.done).length;
  const pending = s.quests.filter((q) => !q.done).map((q) => q.name).slice(0, 4);
  const bestStreak = s.quests.reduce((m, q) => Math.max(m, q.streak), 0);
  const now = Date.now();
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    playerName: s.playerName,
    level: s.level,
    rank: s.hunterRank || 'E',
    rankColor: RANK_COLOR[s.hunterRank] ?? '#7A8BA8',
    xpPct: xpMax > 0 ? Math.min(100, Math.round((s.xp / xpMax) * 100)) : 0,
    xpCur: s.xp,
    xpMax,
    questsDone: done,
    questsTotal: total,
    questsPct: total > 0 ? Math.round((done / total) * 100) : 0,
    pending,
    bestStreak,
    penaltyActive: s.penalty.active,
    resetTargetMs: s.resetTarget,
    resetHours: Math.max(0, Math.ceil((s.resetTarget - now) / 3_600_000)),
    updatedLabel: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Persist a fresh snapshot and re-render any widgets on the home screen. Safe
 * no-op off-Android or when the native module / widgets aren't present. */
export async function updateAllWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const data = buildWidgetData();
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));
    await Promise.all(
      WIDGET_NAMES.map((name) =>
        requestWidgetUpdate({ widgetName: name, renderWidget: () => renderArise(name, data) }),
      ),
    );
  } catch {
    // No widgets added / module unavailable — ignore.
  }
}
