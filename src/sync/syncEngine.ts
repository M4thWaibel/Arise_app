// Snapshot sync orchestration. Sync is ADDITIVE: the app is fully usable with
// no server configured. Last-write-wins by the local stateUpdatedAt vs the
// server's stored client_updated_at.
import { AppState, type AppStateStatus } from 'react-native';

import { api, isSyncConfigured, setApiBaseUrl } from './apiClient';
import { hasSession } from './secureTokens';
import { useGame, serializeForSync } from '@/store/gameStore';

let inFlight = false;

/** Point the API client at whatever server URL the user saved. */
export function configureSyncFromStore(): void {
  const url = useGame.getState().apiUrl;
  setApiBaseUrl(url ? url : null);
}

export type SyncResult = { ok: boolean; direction?: 'push' | 'pull' | 'noop'; error?: string };

/** Regular sync: pull if the server is newer, else push local. */
export async function syncNow(): Promise<SyncResult> {
  configureSyncFromStore();
  if (!isSyncConfigured()) return { ok: false, error: 'Servidor não configurado.' };
  if (!(await hasSession())) return { ok: false, error: 'Entre na sua conta para sincronizar.' };
  if (inFlight) return { ok: false, error: 'Sincronização em andamento.' };

  inFlight = true;
  useGame.getState().setSyncing(true);
  try {
    const remote = await api.getState();
    const local = serializeForSync();
    let direction: SyncResult['direction'] = 'noop';
    if (remote.data && remote.client_updated_at > local.updatedAt) {
      useGame.getState().applySyncState(remote.data, remote.client_updated_at);
      direction = 'pull';
    } else if (!remote.data || local.updatedAt > remote.client_updated_at) {
      await api.putState(local.data, local.updatedAt);
      direction = 'push';
    }
    useGame.getState().setLastSyncAt(Date.now());
    return { ok: true, direction };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha na sincronização.' };
  } finally {
    inFlight = false;
    useGame.getState().setSyncing(false);
  }
}

/** Login/register, then ADOPT the server snapshot if one exists (safe restore on
 * a new device), otherwise upload the local state as the first backup. */
export async function loginAndSync(
  username: string,
  password: string,
  register: boolean,
): Promise<SyncResult> {
  configureSyncFromStore();
  if (!isSyncConfigured()) return { ok: false, error: 'Defina o endereço do servidor primeiro.' };
  try {
    if (register) await api.register(username, password);
    else await api.login(username, password);
    useGame.getState().setSyncAccount(username);

    const remote = await api.getState();
    const local = serializeForSync();
    if (remote.data) {
      useGame.getState().applySyncState(remote.data, remote.client_updated_at);
    } else {
      await api.putState(local.data, local.updatedAt);
    }
    useGame.getState().setLastSyncAt(Date.now());
    startAutoSync();
    return { ok: true, direction: remote.data ? 'pull' : 'push' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao entrar.' };
  }
}

export async function logoutSync(): Promise<void> {
  stopAutoSync();
  await api.logout();
  useGame.getState().setSyncAccount(null);
}

let sub: { remove: () => void } | null = null;

export function startAutoSync(): void {
  configureSyncFromStore();
  if (sub) return;
  sub = AppState.addEventListener('change', (s: AppStateStatus) => {
    if (s === 'active') void syncNow();
  });
}

export function stopAutoSync(): void {
  sub?.remove();
  sub = null;
}
