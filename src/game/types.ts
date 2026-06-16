import type { AttrKey, DiffKey } from '@/theme/tokens';

export interface AttrState {
  level: number;
  xp: number;
}

export type HealthMetric = 'steps' | 'sleep' | 'exercise';

export interface Quest {
  id: number;
  name: string;
  attr: AttrKey;
  diff: DiffKey;
  mandatory: boolean;
  done: boolean;
  streak: number;
  // Health Connect auto-complete: when set, the quest completes itself once the
  // day's metric reaches `metricGoal`.
  metric?: HealthMetric;
  metricGoal?: number;
  // Optional extra objective. When present AND `sideQuestDone` is checked at the
  // moment the quest is completed, the quest awards +10% XP.
  sideQuest?: string;
  sideQuestDone?: boolean;
  // XP actually granted on completion (frozen at complete-time so uncompleting
  // reverses the exact amount, even if the side quest / difficulty was edited).
  awarded?: number;
}

export interface Floor {
  n: string;
  done: boolean;
}

export interface Dungeon {
  id: string;
  name: string;
  rank: string;
  xp: number;
  desc: string;
  floors: Floor[];
}

export interface Title {
  id: string;
  name: string;
  rarity: string;
  desc: string;
  bonus: string;
  unlocked: boolean;
  progress?: string;
}

export interface Penalty {
  active: boolean;
  source: string;
  loss: string;
  tasks: string[];
  debuffPct: number;
  violations: number;
}

export interface SealedAppEntry {
  package: string;
  label: string;
}

export interface FocusGateState {
  startedAt: number;
  durationMin: number;
  status: 'active' | 'cleared' | 'failed';
}

export interface Profile {
  sex: string;
  age: number;
  weight: number;
  height: number | null;
}

export interface SetupForm {
  name: string;
  sex: string;
  age: string;
  weight: string;
  height: string;
}

export interface HabitForm {
  name: string;
  attr: AttrKey;
  diff: DiffKey;
  mandatory: boolean;
  freq: string;
  metric: HealthMetric | 'none';
  metricGoal: string;
  sideQuest: string;
}

export interface DungeonForm {
  name: string;
  desc: string;
  rank: string;
  floors: string[];
}

export interface LevelUpInfo {
  newLevel: number;
  prevRank: string;
  newRank: string;
  rankUp: boolean;
}

export interface QuestFx {
  amount: number;
  color: string;
  key: number;
}

export type Alloc = Record<AttrKey, number>;
