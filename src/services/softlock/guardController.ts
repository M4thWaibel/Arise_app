// Drives the native SystemGuard from store state: the guard runs while a penalty
// is active (or a Focus Gate is running) and there are sealed apps + permissions.
// Opening a sealed app emits an event → we record a violation (escalates the
// penalty / fails the gate). No-ops entirely without the native module.
import { AppState, type AppStateStatus } from 'react-native';

import SystemGuard, { isGuardAvailable, onSealedAppOpened } from './SystemGuard';
import { useGame } from '@/store/gameStore';

let started = false;
let guarding = false;
let lastShouldGuard = false;
let listenerSub: { remove: () => void } | null = null;
let appSub: { remove: () => void } | null = null;
let storeUnsub: (() => void) | null = null;

function shouldGuardNow(): boolean {
  const s = useGame.getState();
  return (s.penalty.active || s.focusGate?.status === 'active') && s.sealedApps.length > 0;
}

async function syncGuard(): Promise<void> {
  if (!isGuardAvailable) return;
  const want = shouldGuardNow();
  if (want === lastShouldGuard && want === guarding) return;
  lastShouldGuard = want;
  if (want && !guarding) {
    const [usage, overlay] = await Promise.all([
      SystemGuard.hasUsageAccess(),
      SystemGuard.hasOverlayPermission(),
    ]);
    if (!usage || !overlay) return; // the Sealed Apps screen prompts for these
    await SystemGuard.startGuard(useGame.getState().sealedApps.map((a) => a.package));
    guarding = true;
  } else if (!want && guarding) {
    await SystemGuard.stopGuard();
    guarding = false;
  }
}

export function startGuardController(): void {
  if (started) return;
  started = true;
  if (!isGuardAvailable) return;
  listenerSub = onSealedAppOpened(() => {
    useGame.getState().recordViolation();
  });
  appSub = AppState.addEventListener('change', (s: AppStateStatus) => {
    if (s === 'active') void syncGuard();
  });
  storeUnsub = useGame.subscribe(() => void syncGuard());
  void syncGuard();
}

export function stopGuardController(): void {
  listenerSub?.remove();
  appSub?.remove();
  storeUnsub?.();
  listenerSub = appSub = null;
  storeUnsub = null;
  started = false;
  if (guarding) {
    void SystemGuard.stopGuard();
    guarding = false;
  }
}
