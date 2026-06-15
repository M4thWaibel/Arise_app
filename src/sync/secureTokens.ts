// JWT tokens live in the device Keychain/Keystore via expo-secure-store —
// NEVER in AsyncStorage (the prompt's security requirement).
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'arise_access_token';
const REFRESH_KEY = 'arise_refresh_token';

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function saveAccess(access: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
}

export async function getAccess(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefresh(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function hasSession(): Promise<boolean> {
  return (await getRefresh()) !== null;
}
