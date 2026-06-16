// Custom entry: keep Expo Router's bootstrap, then register the Android widget
// headless task handler (react-native-android-widget requires this at the app
// entry so it's available even when the app is launched headless by a widget).
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
