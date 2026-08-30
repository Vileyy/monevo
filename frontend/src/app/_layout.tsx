import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { DefaultTheme, ThemeProvider, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";
import { tokenCache } from "@/lib/token-cache";

SplashScreen.preventAutoHideAsync();

const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZW5oYW5jZWQtb2NlbG90LTc4NTEuY2xlcmsuYWNjb3VudHMuZGV2JA";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const restoreSettings = useSettingsStore((state) => state.restoreSettings);

  useEffect(() => {
    void Promise.all([restoreSession(), restoreSettings()]);
  }, [restoreSession, restoreSettings]);

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar barStyle="dark-content" />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add-transaction"
                options={{ presentation: "modal" }}
              />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
