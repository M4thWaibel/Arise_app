// Local notifications — SDK-56-correct API.
//  - handler returns split flags (shouldShowBanner / shouldShowList), NOT the
//    removed shouldShowAlert.
//  - triggers use the typed object form (SchedulableTriggerInputTypes.*), NOT
//    the removed { hour, minute, repeats } shorthand.
// Requires a dev build (won't fully work in Expo Go on SDK 56).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export const CHANNELS = { system: 'system', penalty: 'penalty', ambient: 'ambient' } as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNELS.system, {
    name: 'Sistema',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#3DA9FC',
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.penalty, {
    name: 'Penalidades',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF2D55',
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.ambient, {
    name: 'Lembretes',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#3DA9FC',
  });
}

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function initNotifications(): Promise<boolean> {
  await setupChannels();
  return ensurePermissions();
}

/** Daily quest reminders: 08:00 and a 20:00 reinforcement. */
export async function scheduleDailyReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-morning').catch(() => {});
  await Notifications.cancelScheduledNotificationAsync('daily-evening').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-morning',
    content: { title: '[ ! ] Quest Diária', body: 'Suas quests de hoje aguardam, Caçador.' },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0, channelId: CHANNELS.system },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-evening',
    content: { title: '[ ! ] Reforço noturno', body: 'Conclua suas quists antes do reset da meia-noite.' },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: CHANNELS.system },
  });
}

/** One-off reminders before a penalty's 24h deadline (T−6h and T−1h). */
export async function schedulePenaltyCountdown(expiresAtMs: number): Promise<void> {
  for (const hoursBefore of [6, 1]) {
    const id = `penalty-${hoursBefore}h`;
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    const fireInSeconds = Math.floor((expiresAtMs - Date.now()) / 1000) - hoursBefore * 3600;
    if (fireInSeconds > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: '[ ALERTA DO SISTEMA ]',
          body: `Restam ~${hoursBefore}h para limpar a penalidade. O debuff de XP continua ativo.`,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: fireInSeconds,
          channelId: CHANNELS.penalty,
        },
      });
    }
  }
}

export async function cancelPenaltyCountdown(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('penalty-6h').catch(() => {});
  await Notifications.cancelScheduledNotificationAsync('penalty-1h').catch(() => {});
}

export type SystemEvent =
  | { kind: 'level_up'; level: number }
  | { kind: 'title'; name: string }
  | { kind: 'dungeon'; name: string }
  | { kind: 'auto_quest'; name: string };

/** Immediate banner for in-game events (level-up, title, dungeon clear, auto-complete). */
export async function notifyEvent(event: SystemEvent): Promise<void> {
  const map: Record<SystemEvent['kind'], { title: string; body: string; channel: string }> = {
    level_up: { title: '[ LEVEL UP ]', body: `Você alcançou o nível ${'level' in event ? event.level : ''}.`, channel: CHANNELS.system },
    title: { title: '[ TÍTULO DESBLOQUEADO ]', body: `${'name' in event ? event.name : ''}`, channel: CHANNELS.system },
    dungeon: { title: '[ DUNGEON LIMPA ]', body: `${'name' in event ? event.name : ''} concluída.`, channel: CHANNELS.system },
    auto_quest: { title: '[ QUEST AUTO-CONCLUÍDA ]', body: `${'name' in event ? event.name : ''} — o Sistema registrou.`, channel: CHANNELS.ambient },
  };
  const m = map[event.kind];
  await Notifications.scheduleNotificationAsync({
    content: { title: m.title, body: m.body },
    trigger:
      Platform.OS === 'android'
        ? ({ type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: m.channel } as const)
        : null,
  });
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
