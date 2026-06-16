// Headless task that Android invokes to render a widget (on add, system refresh,
// or resize) — runs even when the app isn't open, so it reads the last snapshot
// the app persisted rather than the live Zustand store.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_STORAGE_KEY, FALLBACK_WIDGET_DATA, type WidgetData } from './types';
import { renderArise } from './components';

async function loadData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (raw) {
      const data = { ...FALLBACK_WIDGET_DATA, ...(JSON.parse(raw) as Partial<WidgetData>) };
      // Recompute the relative reset countdown at render time so a passive
      // system refresh (app not running) doesn't show a stale "~Xh".
      if (data.resetTargetMs > 0) {
        data.resetHours = Math.max(0, Math.ceil((data.resetTargetMs - Date.now()) / 3_600_000));
      }
      return data;
    }
  } catch {
    // fall through to defaults
  }
  return FALLBACK_WIDGET_DATA;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await loadData();
      props.renderWidget(renderArise(props.widgetInfo.widgetName, data));
      break;
    }
    case 'WIDGET_CLICK': // OPEN_APP is handled natively; nothing to do here.
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
