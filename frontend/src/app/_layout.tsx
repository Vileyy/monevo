import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import {
  DefaultTheme,
  ThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import {
  ClerkLoaded,
  ClerkProvider,
  useAuth,
  useUser,
} from "@clerk/clerk-expo";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";
import { tokenCache } from "@/lib/token-cache";
import { initNotifications } from "@/lib/notifications";

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync().catch(() => {});

const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZW5oYW5jZWQtb2NlbG90LTc4NTEuY2xlcmsuYWNjb3VudHMuZGV2JA";

function ClerkSessionSync() {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    let isMounted = true;
    if (isSignedIn && userId && !isAuthenticated) {
      void (async () => {
        try {
          const token = (await getToken()) || userId;
          const email =
            user?.primaryEmailAddress?.emailAddress || `${userId}@clerk.user`;
          const name = user?.fullName || user?.firstName || "Monevo User";
          if (isMounted) {
            login({ id: userId, email, name }, token);
          }
        } catch {}
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, userId, user, isAuthenticated, getToken, login]);

  return null;
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const restoreSettings = useSettingsStore((state) => state.restoreSettings);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    try {
      void initNotifications();
      void Promise.all([restoreSession(), restoreSettings()]);
    } catch {}
  }, [restoreSession, restoreSettings]);

  useEffect(() => {
    if (!isHydrated) return;

    const inProtectedGroup =
      segments[0] === "(tabs)" || segments[0] === "add-transaction";

    if (!isAuthenticated && inProtectedGroup) {
      router.replace("/login");
    } else if (
      isAuthenticated &&
      (segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "onboarding")
    ) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ClerkSessionSync />
        <ThemeProvider value={DefaultTheme}>
          <StatusBar barStyle="dark-content" />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="oauth-native-callback" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add-transaction"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
