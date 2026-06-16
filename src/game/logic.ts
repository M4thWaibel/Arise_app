// Pure gameplay logic — ported exactly from the ARISE prototype's Component class.
import type { AttrKey } from '@/theme/tokens';
import type { AttrState } from './types';

// Both levels start at 5. XP to advance FROM level n to n+1 grows geometrically
// (×1.25 per level) from the level-5 anchors: 1250 for the global level, 1000
// for a status. A quest credits the SAME XP to both pools — only the threshold
// differs, so a status (lower anchor) levels faster than the global level.
export function xpForLevel(n: number): number {
  return Math.round(1250 * Math.pow(1.25, n - 5));
}

// XP to advance an ATTRIBUTE (status) from level n to n+1 (anchor 1000 at lvl 5).
export function xpForAttrLevel(n: number): number {
  return Math.round(1000 * Math.pow(1.25, n - 5));
}

const RANK_TABLE: [number, string, string][] = [
  [100, 'SS', '#FFD24A'],
  [71, 'S', '#C084FC'],
  [51, 'A', '#8B5CF6'],
  [33, 'B', '#1E90FF'],
  [26, 'C', '#00C2FF'],
  [17, 'D', '#3DA9FC'],
  [1, 'E', '#7A8BA8'],
];

export function rankFromLevel(l: number): { letter: string; color: string } {
  for (const [m, letter, color] of RANK_TABLE) {
    if (l >= m) return { letter, color };
  }
  return { letter: 'E', color: '#7A8BA8' };
}

// Dungeon XP distribution: HALF of the total is split equally across the floors
// (any rounding remainder lands on the last floor), and the other half is a
// completion bonus granted only when the final floor is cleared. The per-floor
// shares plus the completion bonus always sum back to exactly `total`.
export function dungeonXpSplit(
  total: number,
  floors: number,
): { perFloor: number[]; completionBonus: number } {
  if (floors <= 0) return { perFloor: [], completionBonus: total };
  const half = Math.round(total * 0.5);
  const base = Math.floor(half / floors);
  const rem = half - base * floors;
  const perFloor = Array.from({ length: floors }, (_, i) => base + (i === floors - 1 ? rem : 0));
  return { perFloor, completionBonus: total - half };
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
