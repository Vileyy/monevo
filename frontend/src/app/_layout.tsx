import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DefaultTheme,
  ThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { PostHogProvider } from 'posthog-react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useCurrencyStore } from '@/store/currency.store';
import { useWalletStore } from '@/store/wallet.store';
import { useTransactionStore } from '@/store/transaction.store';
import { useReminderStore } from '@/store/reminder.store';
import { useBankSyncStore } from '@/store/bank-sync.store';
import {
  setupBankSyncNotificationHandler,
  setupNativeBankNotificationListener,
} from '@/features/bank-sync/services/notificationListener';
import {
  analytics,
  applyAnalyticsPreference,
  identifyUser,
  resetAnalytics,
} from '@/lib/analytics';
import { tokenCache } from '@/lib/token-cache';
import { initNotifications } from '@/lib/notifications';
import { CLERK_LOAD_TIMEOUT_MS, shouldWaitForClerk } from '@/lib/startup';
import { buildClerkProfileUpdates } from '@/features/auth/utils/clerk-profile';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync().catch(() => {});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!clerkPublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please set it in your .env file.',
  );
}

function ClerkUserSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const updateUser = useAuthStore((state) => state.updateUser);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isLoaded || !clerkUser || !currentUser) return;

    const updates = buildClerkProfileUpdates(currentUser, clerkUser);
    if (Object.keys(updates).length > 0) {
      updateUser(updates);
    }
  }, [isLoaded, clerkUser, currentUser, updateUser]);

  return null;
}

function StartupGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const hasApiSession = useAuthStore((state) => state.isAuthenticated);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded || hasApiSession) return;

    const timer = setTimeout(() => setHasTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded, hasApiSession]);

  const clerkReady = !shouldWaitForClerk({
    clerkLoaded: isLoaded,
    apiSessionRestored: hasApiSession,
    clerkTimedOut: hasTimedOut,
  });

  return (
    <>
      <AnimatedSplashOverlay clerkReady={clerkReady} />
      {clerkReady ? children : null}
    </>
  );
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const restoreSettings = useSettingsStore((state) => state.restoreSettings);
  const restoreBankSyncSettings = useBankSyncStore(
    (state) => state.restoreBankSyncSettings,
  );
  const settingsHydrated = useSettingsStore((state) => state.isHydrated);
  const shareAnalytics = useSettingsStore((state) => state.shareAnalytics);
  const restoreRates = useCurrencyStore((state) => state.restoreRates);
  const refreshRates = useCurrencyStore((state) => state.refreshRates);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    try {
      void initNotifications();
      void Promise.all([
        restoreSession(),
        restoreSettings(),
        restoreBankSyncSettings(),
      ]);
    } catch {}
  }, [restoreSession, restoreSettings, restoreBankSyncSettings]);

  useEffect(() => {
    const unsubscribe = setupBankSyncNotificationHandler(() => {
      router.push('/(tabs)');
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = setupNativeBankNotificationListener((payload) => {
      void useBankSyncStore.getState().processNotification(payload);
    });
    return unsubscribe;
  }, [isAuthenticated]);

  const fetchWallets = useWalletStore((state) => state.fetchWallets);
  const fetchTransactions = useTransactionStore(
    (state) => state.fetchTransactions,
  );
  const fetchReminders = useReminderStore((state) => state.fetchReminders);

  // Warm the first screens while the splash is still fading out, so Home draws
  // real data instead of holding its skeleton for another round trip.
  useEffect(() => {
    if (!isAuthenticated) return;
    void Promise.allSettled([
      fetchWallets(),
      fetchTransactions(),
      fetchReminders(),
    ]);
  }, [isAuthenticated, fetchWallets, fetchTransactions, fetchReminders]);

  // Restore the cache first so a slow network never regresses known rates.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await restoreRates();
      if (!cancelled) void refreshRates();
    })();
    return () => {
      cancelled = true;
    };
  }, [restoreRates, refreshRates]);

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user) {
      identifyUser(user);
    } else {
      resetAnalytics();
    }
  }, [isAuthenticated, isHydrated, user]);

  // Honour the analytics opt-out from Settings. Runs after the stored
  // preference is restored and again whenever the user flips the switch.
  useEffect(() => {
    if (!settingsHydrated) return;
    applyAnalyticsPreference(shareAnalytics);
  }, [settingsHydrated, shareAnalytics]);

  useEffect(() => {
    if (!isHydrated) return;

    const inProtectedGroup =
      segments[0] === '(tabs)' || segments[0] === 'add-transaction';

    if (!isAuthenticated && inProtectedGroup) {
      router.replace('/login');
    } else if (
      isAuthenticated &&
      (segments[0] === 'login' ||
        segments[0] === 'register' ||
        segments[0] === 'onboarding')
    ) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  const app = (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar barStyle="dark-content" />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="oauth-native-callback" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-transaction"
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </ErrorBoundary>
    </ThemeProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <StartupGate>
          <ClerkUserSync />
          {analytics ? (
            <PostHogProvider
              client={analytics}
              // Never capture view text here: transaction amounts, notes,
              // wallet balances and profile details are sensitive.
              autocapture={{ captureTouches: false }}
            >
              {app}
            </PostHogProvider>
          ) : (
            app
          )}
        </StartupGate>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
