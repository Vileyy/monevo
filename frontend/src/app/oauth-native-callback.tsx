import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/store/auth.store";
import { colors } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rotating_token_nonce?: string;
    created_session_id?: string;
  }>();
  const { isSignedIn, userId, getToken } = useAuth();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const { user } = useUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginStore = useAuthStore((state) => state.login);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthFlow() {
      if (isAuthenticated) {
        router.replace("/(tabs)");
        return;
      }

      // 1. Process OAuth rotating token nonce if deep-linked back from browser
      if (params.rotating_token_nonce && isSignInLoaded && isSignUpLoaded) {
        try {
          await signIn.reload({
            rotatingTokenNonce: params.rotating_token_nonce,
          });

          let sessionId = "";
          if (signIn.status === "complete") {
            sessionId = signIn.createdSessionId || "";
            if (sessionId && setSignInActive) {
              await setSignInActive({ session: sessionId });
            }
          } else if (
            signIn.firstFactorVerification?.status === "transferable"
          ) {
            const dynamicUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const res = await signUp.create({
              transfer: true,
              username: dynamicUsername,
            });
            sessionId = res.createdSessionId || "";
            if (sessionId && setSignUpActive) {
              await setSignUpActive({ session: sessionId });
            }
          }
        } catch (err) {
          console.warn("Failed to process OAuth params:", err);
        }
      }

      // 2. If already signed in in Clerk, commit session to store
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
        return;
      }

      // 3. Fallback timeout in case redirect fails or is dismissed
      const timer = setTimeout(() => {
        if (isMounted) {
          if (useAuthStore.getState().isAuthenticated) {
            router.replace("/(tabs)");
          } else {
            router.replace("/login");
          }
        }
      }, 5000);

      return () => clearTimeout(timer);
    }

    void handleAuthFlow();

    return () => {
      isMounted = false;
    };
  }, [
    params.rotating_token_nonce,
    isSignInLoaded,
    isSignUpLoaded,
    isSignedIn,
    userId,
    user,
    isAuthenticated,
    getToken,
    loginStore,
    router,
    signIn,
    signUp,
    setSignInActive,
    setSignUpActive,
  ]);

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
