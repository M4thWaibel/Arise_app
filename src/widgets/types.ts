// Shared types for the Android home-screen widgets. The app writes a small
// snapshot of game state here (AsyncStorage) so the headless widget task can
// render even when the app isn't running.

export const WIDGET_STORAGE_KEY = 'arise_widget_data';

export const WIDGET_NAMES = ['AriseHud', 'AriseQuests', 'AriseCompact'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

export interface WidgetData {
  playerName: string;
  level: number;
  rank: string;
  rankColor: string; // hex
  xpPct: number; // 0..100
  xpCur: number;
  xpMax: number;
  questsDone: number;
  questsTotal: number;
  questsPct: number; // 0..100
  pending: string[]; // names of pending quests (top few)
  bestStreak: number;
  penaltyActive: boolean;
  resetTargetMs: number; // absolute epoch ms of next reset (recomputed live on render)
  resetHours: number; // approx hours until daily reset
  updatedLabel: string; // HH:MM the snapshot was written
}

// Shown only before the app has run once (no snapshot yet) — reads as "open the
// app" rather than fabricated stats.
export const FALLBACK_WIDGET_DATA: WidgetData = {
  playerName: 'ABRA O APP',
  level: 5,
  rank: 'E',
  rankColor: '#7A8BA8',
  xpPct: 0,
  xpCur: 0,
  xpMax: 1250,
  questsDone: 0,
  questsTotal: 0,
  questsPct: 0,
  pending: ['Abra o app para sincronizar'],
  bestStreak: 0,
  penaltyActive: false,
  resetTargetMs: 0,
  resetHours: 0,
  updatedLabel: '—',
};
