// react-native-health-connect needs its permission delegate registered in
// MainActivity.onCreate (it sets up an ActivityResultLauncher, which must be
// registered before the activity is STARTED). Since `expo prebuild` regenerates
// MainActivity, this is injected here on every prebuild.
const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

module.exports = function withHealthConnectDelegate(config) {
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') return cfg; // Expo SDK 56 → Kotlin
    let contents = cfg.modResults.contents;

    if (!contents.includes(IMPORT_LINE)) {
      contents = contents.replace(/(^package .*$)/m, `$1\n\n${IMPORT_LINE}`);
    }
    if (!contents.includes(DELEGATE_CALL)) {
      contents = contents.replace(/(super\.onCreate\([^)]*\))/, `$1\n    ${DELEGATE_CALL}`);
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
