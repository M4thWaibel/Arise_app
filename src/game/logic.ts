// Pure gameplay logic — ported exactly from the ARISE prototype's Component class.
import type { AttrKey } from '@/theme/tokens';
import type { AttrState } from './types';

export function xpForLevel(n: number): number {
  return Math.round(100 * Math.pow(n, 1.5));
}

const RANK_TABLE: [number, string, string][] = [
  [80, 'S', '#C084FC'],
  [55, 'A', '#8B5CF6'],
  [35, 'B', '#1E90FF'],
  [20, 'C', '#00C2FF'],
  [10, 'D', '#3DA9FC'],
  [1, 'E', '#7A8BA8'],
];

export function rankFromLevel(l: number): { letter: string; color: string } {
  for (const [m, letter, color] of RANK_TABLE) {
    if (l >= m) return { letter, color };
  }
  return { letter: 'E', color: '#7A8BA8' };
}

export function classFromAttrs(attrs: Record<AttrKey, AttrState>): {
  name: string;
  color: string;
  rare: boolean;
} {
  const map: Record<string, string> = {
    STR: 'Guerreiro',
    AGI: 'Assassino',
    INT: 'Mago',
    VIT: 'Guardião',
    PER: 'Vidente',
  };
  const vals = Object.values(attrs).map((a) => a.level);
  const minL = Math.min(...vals);
  if (minL >= 18) return { name: 'Monarca', color: '#C084FC', rare: true };
  const top = (Object.entries(attrs) as [string, AttrState][]).sort(
    (a, b) => b[1].level - a[1].level,
  )[0][0];
  return { name: map[top], color: '#3DA9FC', rare: false };
}

export function computeAttrs(
  age: number,
  weight: number,
  sex: string,
): Record<AttrKey, number> {
  const c = (v: number) => Math.max(5, Math.min(12, Math.round(v)));
  const m = sex === 'M' ? 1 : 0;
  const fem = sex === 'F' ? 1 : 0;
  return {
    STR: c(7 + (weight - 70) / 9 + m * 1.2 - fem * 0.3 - (age - 28) / 16),
    AGI: c(9.5 - (age - 24) / 7 - (weight - 72) / 13),
    INT: c(6.5 + (age - 18) / 6),
    VIT: c(8 + (weight - 70) / 13 + m * 0.4 - Math.abs(age - 30) / 14),
    PER: c(6.5 + (age - 20) / 6.5 + fem * 0.4),
  };
}

export function fmtHMS(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h + ':' + m + ':' + ss;
}

// Next local midnight as an epoch-ms timestamp (daily reset target).
export function nextMidnight(from: number = Date.now()): number {
  const d = new Date(from);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}
