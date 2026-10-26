import PostHog from 'posthog-react-native';
import type { User } from '@/store/auth.store';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

/**
 * Shared PostHog client. Null when analytics is not configured (CI, tests,
 * contributors without a key) so every helper below becomes a safe no-op.
 */
export const analytics = apiKey
  ? new PostHog(apiKey, {
      host,
      captureAppLifecycleEvents: true,
    })
  : null;

// Dev builds share the same project; tag events so they can be filtered.
void analytics?.register({
  environment: __DEV__ ? 'development' : 'production',
});

export function identifyUser(user: User) {
  // Only the internal id: the privacy policy states that email, name and
  // financial data are never sent to the analytics provider.
  analytics?.identify(user.id);
}

export function resetAnalytics() {
  analytics?.reset();
}

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  analytics?.capture(event, properties);
}
