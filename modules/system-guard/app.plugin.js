// Config plugin — runs on every `expo prebuild`. AndroidManifest is regenerated,
// so this is the ONLY safe place to inject the SystemGuard service, its
// special-use foreground-service property, the permissions, and the <queries>
// needed for package visibility on Android 11+.
const { withAndroidManifest, withGradleProperties, AndroidConfig } = require('@expo/config-plugins');

const withPermissions = AndroidConfig.Permissions.withPermissions;

// RN 0.85 pins Gradle 9.3.1 (removed JvmVendorSpec.IBM_SEMERU) but bundles
// foojay-resolver 0.5.0 which references it. Disabling toolchain auto-download
// makes Gradle use LOCAL JDKs instead of the broken foojay resolver. Persisted
// here so it survives `expo prebuild --clean`. (Needs a JDK 17 installed locally.)
const withNoToolchainAutoDownload = (config) =>
  withGradleProperties(config, (cfg) => {
    const key = 'org.gradle.java.installations.auto-download';
    cfg.modResults = cfg.modResults.filter((i) => !(i.type === 'property' && i.key === key));
    cfg.modResults.push({ type: 'property', key, value: 'false' });
    return cfg;
  });

const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.PACKAGE_USAGE_STATS',
];

const withSystemGuardManifest = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    app.service = app.service || [];
    const serviceName = 'com.matwaibel.arise.systemguard.SystemGuardService';
    if (!app.service.some((s) => s.$['android:name'] === serviceName)) {
      app.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'soft_lock_focus_guard',
            },
          },
        ],
      });
    }

    manifest.manifest.queries = manifest.manifest.queries || [];
    manifest.manifest.queries.push({
      intent: [
        {
          action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
          category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
        },
      ],
    });
    return cfg;
  });

module.exports = (config) => {
  config = withPermissions(config, PERMISSIONS);
  config = withSystemGuardManifest(config);
  config = withNoToolchainAutoDownload(config);
  return config;
};
