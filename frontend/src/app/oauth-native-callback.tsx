import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAuthStore } from "@/store/auth.store";
import { colors } from "@/theme";

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const loginStore = useAuthStore((state) => state.login);

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      if (isSignedIn && userId) {
        try {
          const token = (await getToken()) || userId;
          const email =
            user?.primaryEmailAddress?.emailAddress || `${userId}@clerk.user`;
          const name = user?.fullName || user?.firstName || "Google User";
          if (isMounted) {
            loginStore({ id: userId, email, name }, token);
            router.replace("/(tabs)");
          }
        } catch {
          if (isMounted) {
            router.replace("/(tabs)");
          }
        }
      }
    }

    if (isSignedIn) {
      void handleCallback();
    } else {
      const timer = setTimeout(() => {
        if (isMounted) {
          if (useAuthStore.getState().isAuthenticated) {
            router.replace("/(tabs)");
          } else {
            router.replace("/login");
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, userId, user, getToken, loginStore, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
