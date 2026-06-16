import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AttrKey, DiffKey } from '@/theme/tokens';
import { DIFF, ATTRS, RANK_COLOR } from '@/theme/tokens';
import {
  xpForLevel,
  xpForAttrLevel,
  rankFromLevel,
  computeAttrs,
  nextMidnight,
  dungeonXpSplit,
} from '@/game/logic';
import type {
  AttrState,
  Quest,
  Dungeon,
  Title,
  Penalty,
  Profile,
  SetupForm,
  HabitForm,
  DungeonForm,
  LevelUpInfo,
  QuestFx,
  Alloc,
  SealedAppEntry,
  FocusGateState,
} from '@/game/types';

// Total XP a dungeon is worth, by rank (drives the 50/50 floor split). Dungeons
// span E–S only (SS is hunter-rank exclusive). Mirrors the prototype RANK_XP.
export const DUNGEON_RANK_XP: Record<string, number> = {
  E: 150,
  D: 250,
  C: 400,
  B: 600,
  A: 900,
  S: 1200,
};
export const DUNGEON_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;

const ZERO_ALLOC: Alloc = { STR: 0, AGI: 0, INT: 0, VIT: 0, PER: 0 };
const ORD = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'];

// Base XP for completing a quest, with the +10% side-quest bonus applied when the
// quest has a side quest that was checked off before completion.
function questGain(q: Quest): number {
  const base = DIFF[q.diff].xp;
  return q.sideQuest && q.sideQuestDone ? Math.round(base * 1.1) : base;
}

type GlobalXpPatch = {
  xp: number;
  level: number;
  levelUp?: boolean;
  hunterRank?: string;
  levelUpInfo?: LevelUpInfo;
};

// Inverse of the level-up loop: remove `gain`, borrowing levels back down when
// the XP underflows (so a completion that crossed a level boundary reverses
// exactly instead of leaking a free level). Floors at level 1.
function borrowDownXp(
  level: number,
  xp: number,
  gain: number,
  xpFn: (n: number) => number = xpForLevel,
): { level: number; xp: number; borrowed: number } {
  let lvl = level;
  let x = xp - gain;
  let borrowed = 0;
  while (x < 0 && lvl > 1) {
    lvl--;
    x += xpFn(lvl);
    borrowed++;
  }
  if (x < 0) x = 0;
  return { level: lvl, xp: x, borrowed };
}

// Credit `gain` to the global XP pool, running the level-up loop (each level
// grants 3 free points) and bumping the hunter rank if a threshold was crossed.
// Shared by quest completion and dungeon-floor completion.
function applyGlobalXp(
  s: { xp: number; level: number; hunterRank: string },
  gain: number,
): GlobalXpPatch {
  let xp = s.xp + gain;
  let level = s.level;
  let leveled = 0;
  // Leveling up only raises the level — it grants no status points.
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    leveled++;
  }
  const patch: GlobalXpPatch = { xp, level };
  if (leveled > 0) {
    patch.levelUp = true;
    let hr = s.hunterRank || 'E';
    const der = rankFromLevel(level).letter;
    if (ORD.indexOf(der) > ORD.indexOf(hr)) hr = der;
    patch.hunterRank = hr;
    patch.levelUpInfo = {
      newLevel: level,
      prevRank: s.hunterRank || 'E',
      newRank: hr,
      rankUp: hr !== (s.hunterRank || 'E'),
    };
  }
  return patch;
}

function seedAttrs(): Record<AttrKey, AttrState> {
  const xf = xpForAttrLevel; // attribute curve, so seeded xp stays under the level cap
  const attrs: Record<AttrKey, AttrState> = {
    STR: { level: 14, xp: 0 },
    AGI: { level: 9, xp: 0 },
    INT: { level: 11, xp: 0 },
    VIT: { level: 15, xp: 0 },
    PER: { level: 7, xp: 0 },
  };
  attrs.STR.xp = Math.round(xf(14) * 0.62);
  attrs.AGI.xp = Math.round(xf(9) * 0.3);
  attrs.INT.xp = Math.round(xf(11) * 0.48);
  attrs.VIT.xp = Math.round(xf(15) * 0.81);
  attrs.PER.xp = Math.round(xf(7) * 0.22);
  return attrs;
}

const SEED_QUESTS: Quest[] = [
  { id: 1, name: 'Treino de força', attr: 'STR', diff: 'dificil', mandatory: true, done: false, streak: 5 },
  { id: 2, name: 'Beber 3 L de água', attr: 'VIT', diff: 'facil', mandatory: true, done: false, streak: 23 },
  { id: 3, name: 'Ler 20 páginas', attr: 'INT', diff: 'medio', mandatory: true, done: false, streak: 8 },
  { id: 4, name: 'Dormir entre 20h e 21h', attr: 'VIT', diff: 'medio', mandatory: true, done: false, streak: 3 },
  { id: 5, name: 'Tomar suplementação', attr: 'VIT', diff: 'facil', mandatory: false, done: true, streak: 14 },
  { id: 6, name: 'Caminhar 6.000 passos', attr: 'AGI', diff: 'medio', mandatory: false, done: false, streak: 6 },
  { id: 7, name: 'Deep work — 1h sem distração', attr: 'AGI', diff: 'dificil', mandatory: false, done: false, streak: 4 },
  { id: 8, name: 'Meditar 10 minutos', attr: 'PER', diff: 'facil', mandatory: false, done: false, streak: 9 },
];

const SEED_DUNGEONS: Dungeon[] = [
  {
    id: 'd1', name: 'Recomposição corporal', rank: 'S', xp: 1200,
    desc: 'Atingir 12% de gordura corporal mantendo a força.',
    floors: [
      { n: 'Definir déficit calórico', done: true },
      { n: '8 semanas de treino pesado', done: false },
      { n: 'Cardio 3x/semana — 6 semanas', done: false },
      { n: 'Reavaliação de medidas', done: false },
      { n: 'Fase de manutenção', done: false },
      { n: 'Meta final — 12%', done: false },
    ],
  },
  {
    id: 'd2', name: 'Lançar o aplicativo', rank: 'A', xp: 900,
    desc: 'Tirar o projeto do papel até o lançamento público.',
    floors: [
      { n: 'Especificação & design', done: true },
      { n: 'MVP funcional', done: false },
      { n: 'Beta fechado', done: false },
      { n: 'Polimento & ajustes', done: false },
      { n: 'Lançamento', done: false },
    ],
  },
  {
    id: 'd3', name: 'Meia-maratona — 21 km', rank: 'B', xp: 600,
    desc: 'Completar uma corrida de 21 km.',
    floors: [
      { n: 'Base — 5 km contínuos', done: true },
      { n: '10 km', done: true },
      { n: '15 km', done: false },
      { n: '18 km no ritmo', done: false },
      { n: '21 km — prova', done: false },
    ],
  },
  {
    id: 'd4', name: '12 livros no ano', rank: 'C', xp: 400,
    desc: 'Ler 12 livros até dezembro.',
    floors: [
      { n: 'Livros 1–3', done: true },
      { n: 'Livros 4–6', done: true },
      { n: 'Livros 7–9', done: false },
      { n: 'Livros 10–12', done: false },
    ],
  },
];

const SEED_TITLES: Title[] = [
  { id: 't1', name: 'O Despertar', rarity: 'comum', desc: 'Aceitou o chamado do Sistema.', bonus: '—', unlocked: true },
  { id: 't2', name: 'Constância I', rarity: 'raro', desc: '7 dias seguidos sem falhar.', bonus: '+3% XP global', unlocked: true },
  { id: 't3', name: 'Erudito', rarity: 'raro', desc: 'Inteligência no nível 10.', bonus: '+5% XP de estudo', unlocked: true },
  { id: 't4', name: 'Sobrevivente', rarity: 'épico', desc: 'Limpe uma Penalidade.', bonus: 'Reduz perda de XP em 20%', unlocked: false, progress: 'Penalidade pendente' },
  { id: 't5', name: 'Constância II', rarity: 'épico', desc: '30 dias seguidos sem falhar.', bonus: '+8% XP global', unlocked: false, progress: '23 / 30 dias' },
  { id: 't6', name: 'Conquistador', rarity: 'épico', desc: 'Conclua uma dungeon rank A+.', bonus: '+10% XP de dungeon', unlocked: false, progress: '0 / 1' },
  { id: 't7', name: 'Inquebrável', rarity: 'lendário', desc: '100 dias seguidos sem falhar.', bonus: '+15% XP global', unlocked: false, progress: '23 / 100 dias' },
  { id: 't8', name: 'Monarca', rarity: 'lendário', desc: 'Todos os atributos no nível 20.', bonus: 'Aura lendária + 20% XP', unlocked: false, progress: 'Mín. atual: nv 7 / 20' },
];

export type OverlayKind =
  | null
  | 'distribute'
  | 'penalty'
  | 'create'
  | 'dungeon'
  | 'dungeonCreate'
  | 'settings'
  | 'sealed'
  | 'focusgate';
export type ScreenKey = 'status' | 'quests' | 'dungeons' | 'titles';

const DEFAULT_HABIT_FORM: HabitForm = { name: '', attr: 'STR', diff: 'medio', mandatory: true, freq: 'Diária', metric: 'none', metricGoal: '', sideQuest: '' };
const DEFAULT_DUNGEON_FORM: DungeonForm = { name: '', desc: '', rank: 'C', floors: ['', ''] };
const EMPTY_SETUP: SetupForm = { name: '', sex: '', age: '', weight: '', height: '' };

interface GameState {
  // durable / persisted
  level: number;
  xp: number;
  freePoints: number;
  attrs: Record<AttrKey, AttrState>;
  hunterRank: string;
  playerName: string;
  profile: Profile | null;
  quests: Quest[];
  dungeons: Dungeon[];
  titles: Title[];
  equippedTitle: string;
  penalty: Penalty;
  penaltyDeadline: number;
  resetTarget: number;
  tz: string;
  sealedApps: SealedAppEntry[];
  focusGate: FocusGateState | null;

  // cloud-sync device meta (persisted, NOT synced across devices)
  stateUpdatedAt: number; // last local change to game state (LWW key)
  lastSyncAt: number;
  apiUrl: string;
  syncAccount: string | null;

  // transient (not persisted)
  syncing: boolean;
  screen: ScreenKey;
  editingId: number | null;
  overlay: OverlayKind;
  levelUp: boolean;
  levelUpInfo: LevelUpInfo | null;
  questFx: QuestFx | null;
  alloc: Alloc;
  activeDungeon: string | null;
  setupForm: SetupForm;
  setupError: boolean;
  form: HabitForm;
  dungeonForm: DungeonForm;
  dungeonError: boolean;
  hydrated: boolean;

  // actions
  setHydrated: () => void;
  ensureFreshDay: () => void;
  go: (k: ScreenKey) => void;
  setTz: (v: string) => void;
  setApiUrl: (v: string) => void;
  setSyncAccount: (v: string | null) => void;
  setSyncing: (v: boolean) => void;
  setLastSyncAt: (v: number) => void;
  applySyncState: (data: Record<string, unknown>, remoteTs: number) => void;
  setSetupField: (k: keyof SetupForm, v: string) => void;
  createProfile: () => void;
  openSettings: () => void;
  saveProfile: () => void;
  recalibrate: () => void;
  redoOnboarding: () => void;
  clearExample: () => void;
  openEditHabit: (id: number) => void;
  deleteHabit: () => void;
  openSealed: () => void;
  openFocusGate: () => void;
  addSealedApp: (app: SealedAppEntry) => void;
  removeSealedApp: (pkg: string) => void;
  startFocusGate: (durationMin: number) => void;
  endFocusGate: (status: 'cleared' | 'failed') => void;
  recordViolation: () => void;
  toggleQuest: (id: number) => void;
  toggleSideQuest: (id: number) => void;
  clearQuestFx: () => void;
  afterLevelUp: () => void;
  openDistribute: () => void;
  alloc_: (key: AttrKey, delta: number) => void;
  confirmDistribute: () => void;
  closeOverlay: () => void;
  openPenalty: () => void;
  clearPenalty: () => void;
  openDungeon: (id: string) => void;
  completeFloor: (did: string, idx: number) => void;
  openCreateDungeon: () => void;
  setDungeonName: (v: string) => void;
  setDungeonDesc: (v: string) => void;
  setDungeonRank: (r: string) => void;
  setFloorText: (i: number, v: string) => void;
  addFloor: () => void;
  removeFloor: (i: number) => void;
  saveDungeon: () => void;
  openCreate: () => void;
  setFormName: (v: string) => void;
  setFormAttr: (k: AttrKey) => void;
  setFormDiff: (k: DiffKey) => void;
  setFormMetric: (m: HabitForm['metric']) => void;
  setFormMetricGoal: (v: string) => void;
  setFormSideQuest: (v: string) => void;
  toggleFormMandatory: () => void;
  saveHabit: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      level: 12,
      xp: xpForLevel(12) - 75,
      freePoints: 0,
      attrs: seedAttrs(),
      hunterRank: 'E',
      playerName: 'CAÇADOR',
      profile: null,
      quests: SEED_QUESTS,
      dungeons: SEED_DUNGEONS,
      titles: SEED_TITLES,
      equippedTitle: 'Constância I',
      penalty: {
        active: true,
        source: 'Treino de força',
        loss: '−15% do XP até a recuperação',
        tasks: ['100 flexões', '100 abdominais', '100 agachamentos', 'Correr 5 km'],
        debuffPct: 15,
        violations: 0,
      },
      sealedApps: [],
      focusGate: null,
      penaltyDeadline: Date.now() + 6 * 3600 * 1000,
      resetTarget: nextMidnight(),
      tz: 'UTC−3 · Brasília',

      stateUpdatedAt: Date.now(),
      lastSyncAt: 0,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
      syncAccount: null,

      syncing: false,
      screen: 'status',
      editingId: null,
      overlay: null,
      levelUp: false,
      levelUpInfo: null,
      questFx: null,
      alloc: { ...ZERO_ALLOC },
      activeDungeon: null,
      setupForm: { name: '', sex: '', age: '', weight: '', height: '' },
      setupError: false,
      form: { ...DEFAULT_HABIT_FORM },
      dungeonForm: { ...DEFAULT_DUNGEON_FORM, floors: [...DEFAULT_DUNGEON_FORM.floors] },
      dungeonError: false,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      // Daily reset: at local midnight, clear quest completion and roll the target.
      ensureFreshDay: () => {
        const s = get();
        if (Date.now() >= s.resetTarget) {
          set({
            quests: s.quests.map((q) => ({ ...q, done: false, sideQuestDone: false, awarded: undefined })),
            resetTarget: nextMidnight(),
          });
        }
      },

      go: (k) => set({ screen: k, overlay: null }),
      setTz: (v) => set({ tz: v }),
      setApiUrl: (v) => set({ apiUrl: v }),
      setSyncAccount: (v) => set({ syncAccount: v }),
      setSyncing: (v) => set({ syncing: v }),
      setLastSyncAt: (v) => set({ lastSyncAt: v }),
      applySyncState: (data, remoteTs) => applyRemoteGameState(data, remoteTs),

      setSetupField: (k, v) =>
        set((s) => ({ setupForm: { ...s.setupForm, [k]: v } })),

      createProfile: () => {
        const f = get().setupForm;
        const age = parseInt(f.age, 10);
        const weight = parseFloat(f.weight);
        if (!f.name.trim() || !age || !weight) {
          set({ setupError: true });
          return;
        }
        // Every Hunter awakens at level 5, with all 5 attributes at level 5, rank E.
        const attrs = {} as Record<AttrKey, AttrState>;
        (['STR', 'AGI', 'INT', 'VIT', 'PER'] as AttrKey[]).forEach((k) => {
          attrs[k] = { level: 5, xp: 0 };
        });
        set({
          playerName: f.name.trim().toUpperCase(),
          profile: {
            sex: f.sex || 'O',
            age,
            weight,
            height: f.height ? parseInt(f.height, 10) : null,
          },
          attrs,
          level: 5,
          xp: 0,
          hunterRank: 'E',
          freePoints: 0,
          screen: 'status',
          setupError: false,
        });
      },

      openSettings: () => {
        const s = get();
        const p = s.profile;
        set({
          setupForm: {
            name: s.playerName && s.playerName !== 'CAÇADOR' ? s.playerName : '',
            sex: p?.sex || '',
            age: p?.age ? String(p.age) : '',
            weight: p?.weight ? String(p.weight) : '',
            height: p?.height ? String(p.height) : '',
          },
          overlay: 'settings',
          setupError: false,
        });
      },

      saveProfile: () => {
        const f = get().setupForm;
        if (!f.name.trim()) {
          set({ setupError: true });
          return;
        }
        set((s) => ({
          playerName: f.name.trim().toUpperCase(),
          profile: {
            sex: f.sex || s.profile?.sex || 'O',
            age: parseInt(f.age, 10) || s.profile?.age || 0,
            weight: parseFloat(f.weight) || s.profile?.weight || 0,
            height: f.height ? parseInt(f.height, 10) : s.profile?.height ?? null,
          },
          overlay: null,
          setupError: false,
        }));
      },

      recalibrate: () => {
        const f = get().setupForm;
        const age = parseInt(f.age, 10);
        const weight = parseFloat(f.weight);
        if (!age || !weight) {
          set({ setupError: true });
          return;
        }
        const lvls = computeAttrs(age, weight, f.sex || 'O');
        const attrs = {} as Record<AttrKey, AttrState>;
        (['STR', 'AGI', 'INT', 'VIT', 'PER'] as AttrKey[]).forEach((k) => {
          attrs[k] = { level: lvls[k], xp: Math.round(xpForAttrLevel(lvls[k]) * 0.35) };
        });
        set({ attrs, setupError: false });
      },

      redoOnboarding: () =>
        set({ overlay: null, setupForm: { ...EMPTY_SETUP }, setupError: false }),

      clearExample: () =>
        set((s) => ({
          quests: [],
          dungeons: [],
          penalty: { ...s.penalty, active: false },
          titles: s.titles.map((t) =>
            t.id === 't1' ? { ...t, unlocked: true, progress: undefined } : { ...t, unlocked: false },
          ),
          overlay: null,
          screen: 'quests',
        })),

      toggleQuest: (id) => {
        const q = get().quests.find((x) => x.id === id);
        if (!q) return;
        if (q.done) {
          // Reverse the exact amount that was granted (frozen in `awarded`),
          // borrowing back any level-ups it caused so no free level/points leak.
          const gain = q.awarded ?? questGain(q);
          set((s) => {
            const quests = s.quests.map((x) =>
              x.id === id ? { ...x, done: false, streak: Math.max(0, x.streak - 1), awarded: undefined } : x,
            );
            const attrs = { ...s.attrs };
            const ra = borrowDownXp(attrs[q.attr].level, attrs[q.attr].xp, gain, xpForAttrLevel);
            attrs[q.attr] = { level: ra.level, xp: ra.xp };
            const rg = borrowDownXp(s.level, s.xp, gain);
            return {
              quests,
              attrs,
              level: rg.level,
              xp: rg.xp,
              freePoints: Math.max(0, s.freePoints - rg.borrowed * 3),
              hunterRank: rankFromLevel(rg.level).letter,
            };
          });
          return;
        }
        const gain = questGain(q);
        const ac = ATTRS.find((a) => a.key === q.attr)!.color;
        set((s) => {
          const quests = s.quests.map((x) =>
            x.id === id ? { ...x, done: true, streak: x.streak + 1, awarded: gain } : x,
          );
          const attrs = { ...s.attrs };
          const a = { ...attrs[q.attr] };
          a.xp += gain;
          while (a.xp >= xpForAttrLevel(a.level)) {
            a.xp -= xpForAttrLevel(a.level);
            a.level++;
          }
          attrs[q.attr] = a;
          const g = applyGlobalXp(s, gain);
          return { quests, attrs, questFx: { amount: gain, color: ac, key: Date.now() }, ...g };
        });
      },

      // Toggle the side quest's own check. Only allowed while the parent quest is
      // not yet completed — the +10% is locked in at completion time.
      toggleSideQuest: (id) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === id && q.sideQuest && !q.done ? { ...q, sideQuestDone: !q.sideQuestDone } : q,
          ),
        })),

      clearQuestFx: () => set({ questFx: null }),

      afterLevelUp: () =>
        set((s) =>
          s.freePoints > 0
            ? { levelUp: false, overlay: 'distribute', alloc: { ...ZERO_ALLOC } }
            : { levelUp: false },
        ),

      openDistribute: () => set({ overlay: 'distribute', alloc: { ...ZERO_ALLOC } }),

      alloc_: (key, delta) =>
        set((s) => {
          const used = Object.values(s.alloc).reduce((a, b) => a + b, 0);
          if (delta > 0 && used >= s.freePoints) return {};
          if (delta < 0 && s.alloc[key] <= 0) return {};
          return { alloc: { ...s.alloc, [key]: s.alloc[key] + delta } };
        }),

      confirmDistribute: () =>
        set((s) => {
          const attrs = { ...s.attrs };
          let used = 0;
          for (const k in s.alloc) {
            const key = k as AttrKey;
            used += s.alloc[key];
            attrs[key] = { ...attrs[key], level: attrs[key].level + s.alloc[key] };
          }
          return {
            attrs,
            freePoints: s.freePoints - used,
            alloc: { ...ZERO_ALLOC },
            overlay: null,
          };
        }),

      closeOverlay: () => set({ overlay: null, levelUp: false }),

      openPenalty: () => set({ overlay: 'penalty' }),

      clearPenalty: () =>
        set((s) => {
          const titles = s.titles.map((t) =>
            t.name === 'Sobrevivente' ? { ...t, unlocked: true, progress: undefined } : t,
          );
          return { penalty: { ...s.penalty, active: false }, titles, overlay: null };
        }),

      openDungeon: (id) => set({ activeDungeon: id, overlay: 'dungeon' }),

      // Floors clear top-to-bottom: only the first not-yet-done floor can be
      // completed, and floors never un-complete. Each floor grants its split
      // share; clearing the last floor also grants the 50% completion bonus.
      completeFloor: (did, idx) => {
        const d = get().dungeons.find((x) => x.id === did);
        if (!d) return;
        const nextIdx = d.floors.findIndex((f) => !f.done);
        if (nextIdx === -1 || idx !== nextIdx) return; // locked or already cleared
        const n = d.floors.length;
        const isLast = idx === n - 1;
        const { perFloor, completionBonus } = dungeonXpSplit(d.xp, n);
        const gain = perFloor[idx] + (isLast ? completionBonus : 0);
        const color = RANK_COLOR[d.rank] ?? '#3DA9FC';
        set((s) => {
          const dungeons = s.dungeons.map((x) =>
            x.id === did
              ? { ...x, floors: x.floors.map((f, i) => (i === idx ? { ...f, done: true } : f)) }
              : x,
          );
          const g = applyGlobalXp(s, gain);
          return { dungeons, questFx: { amount: gain, color, key: Date.now() }, ...g };
        });
      },

      openCreateDungeon: () =>
        set({
          dungeonForm: { ...DEFAULT_DUNGEON_FORM, floors: [...DEFAULT_DUNGEON_FORM.floors] },
          dungeonError: false,
          overlay: 'dungeonCreate',
        }),
      setDungeonName: (v) => set((s) => ({ dungeonForm: { ...s.dungeonForm, name: v } })),
      setDungeonDesc: (v) => set((s) => ({ dungeonForm: { ...s.dungeonForm, desc: v } })),
      setDungeonRank: (r) => set((s) => ({ dungeonForm: { ...s.dungeonForm, rank: r } })),
      setFloorText: (i, v) =>
        set((s) => {
          const floors = s.dungeonForm.floors.slice();
          floors[i] = v;
          return { dungeonForm: { ...s.dungeonForm, floors } };
        }),
      addFloor: () =>
        set((s) => ({ dungeonForm: { ...s.dungeonForm, floors: [...s.dungeonForm.floors, ''] } })),
      removeFloor: (i) =>
        set((s) => {
          const floors = s.dungeonForm.floors.filter((_, idx) => idx !== i);
          return { dungeonForm: { ...s.dungeonForm, floors: floors.length ? floors : [''] } };
        }),
      saveDungeon: () => {
        const f = get().dungeonForm;
        const floors = f.floors.map((x) => x.trim()).filter(Boolean);
        if (!f.name.trim() || floors.length === 0) {
          set({ dungeonError: true });
          return;
        }
        const dungeon: Dungeon = {
          id: 'd' + Date.now(),
          name: f.name.trim(),
          rank: f.rank,
          xp: DUNGEON_RANK_XP[f.rank] ?? DUNGEON_RANK_XP.C,
          desc: f.desc.trim() || 'Meta de longo prazo definida por você.',
          floors: floors.map((n) => ({ n, done: false })),
        };
        set((s) => ({
          dungeons: [...s.dungeons, dungeon],
          overlay: null,
          dungeonError: false,
          screen: 'dungeons',
        }));
      },

      openCreate: () =>
        set({ form: { ...DEFAULT_HABIT_FORM }, editingId: null, overlay: 'create' }),

      openSealed: () => set({ overlay: 'sealed' }),
      openFocusGate: () => set({ overlay: 'focusgate' }),

      addSealedApp: (app) =>
        set((s) =>
          s.sealedApps.some((a) => a.package === app.package)
            ? {}
            : { sealedApps: [...s.sealedApps, app] },
        ),

      removeSealedApp: (pkg) =>
        set((s) => ({ sealedApps: s.sealedApps.filter((a) => a.package !== pkg) })),

      startFocusGate: (durationMin) =>
        set({ focusGate: { startedAt: Date.now(), durationMin, status: 'active' }, overlay: null }),

      endFocusGate: (status) =>
        set((s) => {
          if (!s.focusGate) return { focusGate: null };
          if (status === 'cleared') {
            // Reward focus: credit PER + global XP (same curve/level-up path).
            const attrs = { ...s.attrs };
            const per = { ...attrs.PER };
            per.xp += 40;
            while (per.xp >= xpForAttrLevel(per.level)) {
              per.xp -= xpForAttrLevel(per.level);
              per.level++;
            }
            attrs.PER = per;
            let xp = s.xp + 40;
            let level = s.level;
            while (xp >= xpForLevel(level)) {
              xp -= xpForLevel(level);
              level++;
            }
            return { attrs, xp, level, focusGate: null };
          }
          return { focusGate: { ...s.focusGate, status: 'failed' } };
        }),

      // Soft-Lock consequence: opening a sealed app escalates the active penalty
      // (or fails an active Focus Gate).
      recordViolation: () =>
        set((s) => {
          if (s.focusGate?.status === 'active') {
            return { focusGate: { ...s.focusGate, status: 'failed' } };
          }
          if (!s.penalty.active) return {};
          const debuffPct = Math.min(60, s.penalty.debuffPct + 5);
          const violations = s.penalty.violations + 1;
          return {
            penalty: { ...s.penalty, debuffPct, violations, loss: `−${debuffPct}% do XP até a recuperação` },
            penaltyDeadline: s.penaltyDeadline + 30 * 60 * 1000,
          };
        }),

      openEditHabit: (id) => {
        const q = get().quests.find((x) => x.id === id);
        if (!q) return;
        set({
          form: {
            name: q.name,
            attr: q.attr,
            diff: q.diff,
            mandatory: q.mandatory,
            freq: 'Diária',
            metric: q.metric ?? 'none',
            metricGoal: q.metricGoal ? String(q.metricGoal) : '',
            sideQuest: q.sideQuest ?? '',
          },
          editingId: id,
          overlay: 'create',
        });
      },

      deleteHabit: () =>
        set((s) => ({
          quests: s.quests.filter((q) => q.id !== s.editingId),
          overlay: null,
          editingId: null,
        })),

      setFormName: (v) => set((s) => ({ form: { ...s.form, name: v } })),
      setFormAttr: (k) => set((s) => ({ form: { ...s.form, attr: k } })),
      setFormDiff: (k) => set((s) => ({ form: { ...s.form, diff: k } })),
      setFormMetric: (m) => set((s) => ({ form: { ...s.form, metric: m } })),
      setFormMetricGoal: (v) => set((s) => ({ form: { ...s.form, metricGoal: v.replace(/[^0-9]/g, '') } })),
      setFormSideQuest: (v) => set((s) => ({ form: { ...s.form, sideQuest: v } })),
      toggleFormMandatory: () =>
        set((s) => ({ form: { ...s.form, mandatory: !s.form.mandatory } })),

      saveHabit: () => {
        const f = get().form;
        if (!f.name.trim()) return;
        const goalNum = parseInt(f.metricGoal, 10);
        const metric = f.metric !== 'none' && goalNum > 0 ? f.metric : undefined;
        const metricGoal = metric ? goalNum : undefined;
        const sideQuest = f.sideQuest.trim() || undefined;
        set((s) => {
          if (s.editingId) {
            const quests = s.quests.map((q) =>
              q.id === s.editingId
                ? {
                    ...q,
                    name: f.name.trim(),
                    attr: f.attr,
                    diff: f.diff,
                    mandatory: f.mandatory,
                    metric,
                    metricGoal,
                    sideQuest,
                    // Drop the side-quest check if its text was removed.
                    sideQuestDone: sideQuest ? q.sideQuestDone : false,
                  }
                : q,
            );
            return { quests, overlay: null, editingId: null, form: { ...DEFAULT_HABIT_FORM } };
          }
          const id = Math.max(0, ...s.quests.map((q) => q.id)) + 1;
          const q: Quest = {
            id,
            name: f.name.trim(),
            attr: f.attr,
            diff: f.diff,
            mandatory: f.mandatory,
            done: false,
            streak: 0,
            metric,
            metricGoal,
            sideQuest,
            sideQuestDone: false,
          };
          return {
            quests: [...s.quests, q],
            overlay: null,
            editingId: null,
            form: { ...DEFAULT_HABIT_FORM },
            screen: 'quests',
          };
        });
      },
    }),
    {
      name: 'arise-game-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist durable game state — never transient UI/overlay state.
      partialize: (s) => ({
        level: s.level,
        xp: s.xp,
        freePoints: s.freePoints,
        attrs: s.attrs,
        hunterRank: s.hunterRank,
        playerName: s.playerName,
        profile: s.profile,
        quests: s.quests,
        dungeons: s.dungeons,
        titles: s.titles,
        equippedTitle: s.equippedTitle,
        penalty: s.penalty,
        penaltyDeadline: s.penaltyDeadline,
        resetTarget: s.resetTarget,
        tz: s.tz,
        sealedApps: s.sealedApps,
        focusGate: s.focusGate,
        stateUpdatedAt: s.stateUpdatedAt,
        lastSyncAt: s.lastSyncAt,
        apiUrl: s.apiUrl,
        syncAccount: s.syncAccount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Adopt the persisted slice as the baseline so rehydration itself is
          // not treated as a local change (which would bump stateUpdatedAt).
          lastHash = JSON.stringify(gameSlice(state));
          state.setHydrated();
        }
      },
    },
  ),
);

// ---- Cloud-sync slice helpers ----
// The game-state keys that sync across devices (device meta like apiUrl excluded).
const GAME_KEYS = [
  'level', 'xp', 'freePoints', 'attrs', 'hunterRank', 'playerName', 'profile',
  'quests', 'dungeons', 'titles', 'equippedTitle', 'penalty', 'penaltyDeadline',
  'resetTarget', 'tz', 'sealedApps', 'focusGate',
] as const;

function gameSlice(s: GameState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const rec = s as unknown as Record<string, unknown>;
  for (const k of GAME_KEYS) out[k] = rec[k];
  return out;
}

/** The synced payload + its last-write-wins timestamp. */
export function serializeForSync(): { data: Record<string, unknown>; updatedAt: number } {
  const s = useGame.getState();
  return { data: gameSlice(s), updatedAt: s.stateUpdatedAt };
}

let applyingRemote = false;
let lastHash = JSON.stringify(gameSlice(useGame.getState()));

function applyRemoteGameState(data: Record<string, unknown>, remoteTs: number) {
  applyingRemote = true;
  const patch: Record<string, unknown> = {};
  for (const k of GAME_KEYS) if (k in data) patch[k] = data[k];
  patch.stateUpdatedAt = remoteTs;
  useGame.setState(patch as Partial<GameState>);
  lastHash = JSON.stringify(gameSlice(useGame.getState()));
  applyingRemote = false;
}

// Mark game state dirty (bump stateUpdatedAt) whenever the synced slice changes.
useGame.subscribe((state) => {
  if (applyingRemote || !state.hydrated) return;
  const hash = JSON.stringify(gameSlice(state));
  if (hash !== lastHash) {
    lastHash = hash;
    useGame.setState({ stateUpdatedAt: Date.now() });
  }
});
