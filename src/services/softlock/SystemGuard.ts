// Resilient wrapper around the native SystemGuard module. The native module
// only exists in a dev build / EAS APK; in Expo Go (or any build without it)
// this falls back to no-ops so the app never crashes.
import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

export type InstalledApp = { package: string; label: string };
export type SealedAppOpenedEvent = { package: string; ts: number };

interface SystemGuardNative {
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): void;
  hasOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): void;
  startGuard(sealedPackages: string[]): Promise<void>;
  stopGuard(): Promise<void>;
  listInstalledApps(): Promise<InstalledApp[]>;
  addListener(
    event: 'sealedAppOpened',
    listener: (e: SealedAppOpenedEvent) => void,
  ): EventSubscription;
}

let native: SystemGuardNative | null = null;
try {
  native = requireNativeModule<SystemGuardNative>('SystemGuard');
} catch {
  native = null;
}

export const isGuardAvailable = native !== null;

const noopAsync = async () => {};
const SystemGuard: SystemGuardNative = native ?? {
  hasUsageAccess: async () => false,
  openUsageAccessSettings: () => {},
  hasOverlayPermission: async () => false,
  requestOverlayPermission: () => {},
  startGuard: noopAsync,
  stopGuard: noopAsync,
  listInstalledApps: async () => [],
  addListener: () => ({ remove: () => {} }) as EventSubscription,
};

export default SystemGuard;

export function onSealedAppOpened(cb: (e: SealedAppOpenedEvent) => void): EventSubscription {
  return SystemGuard.addListener('sealedAppOpened', cb);
}
