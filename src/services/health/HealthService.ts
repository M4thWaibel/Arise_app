// Health Connect (Android) — read steps/sleep/exercise to auto-complete
// metric-goal quests. Android-only; degrades gracefully (no-ops) elsewhere or
// when Health Connect isn't installed/permitted. Requires a dev build.
import { Platform } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';

const PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
];

export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function ensurePermissions(): Promise<boolean> {
  if (!(await isAvailable())) return false;
  try {
    const ok = await initialize();
    if (!ok) return false;
    const granted = await requestPermission(PERMISSIONS);
    return granted.length > 0;
  } catch {
    return false;
  }
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export interface TodayMetrics {
  steps: number;
  sleepMinutes: number;
  exerciseSessions: number;
}

export async function readToday(): Promise<TodayMetrics> {
  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: startOfTodayIso(),
    endTime: new Date().toISOString(),
  };
  const ok = await initialize();
  if (!ok) return { steps: 0, sleepMinutes: 0, exerciseSessions: 0 };

  const steps = await readRecords('Steps', { timeRangeFilter });
  const sleep = await readRecords('SleepSession', { timeRangeFilter });
  const exercise = await readRecords('ExerciseSession', { timeRangeFilter });

  const totalSteps = steps.records.reduce(
    (sum, r) => sum + ((r as { count?: number }).count ?? 0),
    0,
  );
  const sleepMinutes = sleep.records.reduce(
    (sum, r) => sum + minutesBetween((r as { startTime: string }).startTime, (r as { endTime: string }).endTime),
    0,
  );
  return { steps: totalSteps, sleepMinutes, exerciseSessions: exercise.records.length };
}
