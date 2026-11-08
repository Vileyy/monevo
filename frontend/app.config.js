/**
 * Dynamic Expo config on top of app.json.
 *
 * app.json keeps every static setting. This wrapper only adjusts build-time
 * flags that differ between local development and store builds:
 *
 * - Android cleartext traffic must stay enabled for Metro / dev-client builds
 *   (http://<lan-ip>:8081) but must be disabled for production releases so the
 *   Play Data safety answer "data is encrypted in transit" stays accurate.
 *
 * It also warns (without failing the build) when a store build is configured
 * with values that would break review, such as a non-HTTPS API URL or a Clerk
 * test key.
 */
const isProductionBuild =
  process.env.EAS_BUILD_PROFILE === 'production' ||
  process.env.APP_VARIANT === 'production';

function withCleartextSetting(plugins, usesCleartextTraffic) {
  return (plugins ?? []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') {
      return plugin;
    }

    const [name, options = {}] = plugin;
    return [
      name,
      {
        ...options,
        android: {
          ...(options.android ?? {}),
          usesCleartextTraffic,
        },
      },
    ];
  });
}

module.exports = ({ config }) => {
  if (isProductionBuild) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
    const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

    if (!apiUrl.startsWith('https://')) {
      console.warn(
        `[app.config] EXPO_PUBLIC_API_URL must be HTTPS for a Play release (got "${apiUrl || 'unset'}").`,
      );
    }

    if (!clerkKey || clerkKey.startsWith('pk_test_')) {
      console.warn(
        '[app.config] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or uses a test key; production builds need pk_live_.',
      );
    }
  }

  return {
    ...config,
    plugins: withCleartextSetting(config.plugins, !isProductionBuild),
  };
};
