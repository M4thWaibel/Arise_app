// Bridges Health Connect metrics to the quest loop: any incomplete quest with a
// metric goal auto-completes (crediting XP) once today's value reaches the goal.
import { AppState, type AppStateStatus } from 'react-native';

import { useGame } from '@/store/gameStore';
import { notifyEvent } from '@/services/NotificationService';
import { isAvailable, readToday } from './HealthService';
import type { HealthMetric } from '@/game/types';

export async function syncHealthQuests(): Promise<void> {
  if (!(await isAvailable())) return;
  let today;
  try {
    today = await readToday();
  } catch {
    return;
  }
  const value: Record<HealthMetric, number> = {
    steps: today.steps,
    sleep: today.sleepMinutes,
    exercise: today.exerciseSessions,
  };
  const state = useGame.getState();
  for (const q of state.quests) {
    if (q.done || !q.metric || !q.metricGoal) continue;
    if (value[q.metric] >= q.metricGoal) {
      state.toggleQuest(q.id); // completes + awards XP through the normal path
      void notifyEvent({ kind: 'auto_quest', name: q.name });
    }
  }
}

let sub: { remove: () => void } | null = null;

/** Sync now and on every app foreground. Safe to call when HC is unavailable. */
export function startHealthSync(): void {
  void syncHealthQuests();
  if (sub) return;
  sub = AppState.addEventListener('change', (s: AppStateStatus) => {
    if (s === 'active') void syncHealthQuests();
  });
}

export function stopHealthSync(): void {
  sub?.remove();
  sub = null;
}
