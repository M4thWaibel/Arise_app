// Design tokens — ported exactly from the ARISE design prototype (Arise.dc.html).
// Colors, fonts and gameplay maps are the single source of visual truth.

export const Colors = {
  bgBase: '#05070D',
  surface: '#0D1320',
  systemBlue: '#1E90FF',
  glow: '#3DA9FC',
  glowCyan: '#00C2FF',
  purple: '#8B5CF6',
  purpleDeep: '#6D28D9',
  purpleLight: '#C084FC',
  red: '#EF4444',
  redAlert: '#FF2D55',
  redSoft: '#FF6178',
  redSofter: '#FF7A8A',
  text: '#E6F1FF',
  textSoft: '#9FB2D0',
  label: '#7A8BA8',
  labelDim: '#5C7299',
  labelDimmer: '#566A8E',
  navInactive: '#46587C',
  statusText: '#C6D6F0',
} as const;

// Font family names match the keys loaded via useFonts() in app/_layout.tsx
export const Fonts = {
  // Rajdhani — titles / HUD
  rajRegular: 'Rajdhani_400Regular',
  rajMedium: 'Rajdhani_500Medium',
  rajSemiBold: 'Rajdhani_600SemiBold',
  rajBold: 'Rajdhani_700Bold',
  // Chivo — body
  chivoLight: 'Chivo_300Light',
  chivoRegular: 'Chivo_400Regular',
  chivoMedium: 'Chivo_500Medium',
  chivoBold: 'Chivo_700Bold',
  // JetBrains Mono — system messages / timers
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

// Absolute-fill helper (RN 0.85 types only expose StyleSheet.absoluteFill).
export const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };

export type AttrKey = 'STR' | 'AGI' | 'INT' | 'VIT' | 'PER';
export type DiffKey = 'facil' | 'medio' | 'dificil' | 'extremo';

export const ATTRS: { key: AttrKey; label: string; cat: string; color: string }[] = [
  { key: 'STR', label: 'Força', cat: 'Treino físico', color: '#3DA9FC' },
  { key: 'AGI', label: 'Agilidade', cat: 'Execução / foco', color: '#1E90FF' },
  { key: 'INT', label: 'Inteligência', cat: 'Estudo', color: '#8B5CF6' },
  { key: 'VIT', label: 'Vitalidade', cat: 'Saúde / sono', color: '#00C2FF' },
  { key: 'PER', label: 'Percepção', cat: 'Mindfulness', color: '#60A5FA' },
];

export const ATTR_COLOR: Record<AttrKey, string> = {
  STR: '#3DA9FC',
  AGI: '#1E90FF',
  INT: '#8B5CF6',
  VIT: '#00C2FF',
  PER: '#60A5FA',
};

export const DIFF: Record<DiffKey, { label: string; xp: number; color: string }> = {
  facil: { label: 'Fácil', xp: 10, color: '#5B7BA8' },
  medio: { label: 'Médio', xp: 25, color: '#3DA9FC' },
  dificil: { label: 'Difícil', xp: 50, color: '#8B5CF6' },
  extremo: { label: 'Extremo', xp: 100, color: '#FF2D55' },
};

export const RANK_COLOR: Record<string, string> = {
  E: '#7A8BA8',
  D: '#3DA9FC',
  C: '#00C2FF',
  B: '#1E90FF',
  A: '#8B5CF6',
  S: '#C084FC',
  SS: '#FFD24A',
};

export const RARITY_COLOR: Record<string, string> = {
  comum: '#7A8BA8',
  raro: '#3DA9FC',
  épico: '#8B5CF6',
  lendário: '#C084FC',
};
