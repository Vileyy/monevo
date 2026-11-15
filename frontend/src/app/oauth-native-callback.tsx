import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/store/auth.store';
import { extractClerkErrorMessage } from '@/features/auth/utils/auth-helpers';
import { colors } from '@/theme';
import {
  buildSessionUser,
  exchangeClerkToken,
} from '@/features/auth/utils/session';

WebBrowser.maybeCompleteAuthSession();

/** Give up waiting for Clerk and return to the sign-in screen. */
const CALLBACK_TIMEOUT_MS = 6000;

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
  const loginStore = useAuthStore((state) => state.login);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let isMounted = true;

    const fallbackTimer = setTimeout(() => {
      if (!isMounted) return;
      router.replace(
        useAuthStore.getState().isAuthenticated ? '/(tabs)' : '/login',
      );
    }, CALLBACK_TIMEOUT_MS);

    async function completeSignIn(clerkToken: string | null) {
      if (!clerkToken) return false;

      const email = user?.primaryEmailAddress?.emailAddress || '';
      const name =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        (email ? email.split('@')[0] : 'Google User');

      try {
        const session = await exchangeClerkToken(clerkToken, name);
        if (!isMounted) return true;

        loginStore(
          buildSessionUser(session, {
            email,
            name,
            avatarUrl: user?.imageUrl || undefined,
          }),
          session.accessToken,
        );
        router.replace('/(tabs)');
        return true;
      } catch (error) {
        console.warn(
          'Failed to complete sign-in:',
          extractClerkErrorMessage(error),
        );
        return false;
      }
    }

    async function handleAuthFlow() {
      if (useAuthStore.getState().isAuthenticated) {
        router.replace('/(tabs)');
        return;
      }

      // 1. Finish the OAuth hand-off when the browser returns a rotating nonce.
      if (params.rotating_token_nonce && isSignInLoaded && isSignUpLoaded) {
        try {
          await signIn.reload({
            rotatingTokenNonce: params.rotating_token_nonce,
          });

          if (signIn.status === 'complete') {
            const sessionId = signIn.createdSessionId || '';
            if (sessionId && setSignInActive) {
              await setSignInActive({ session: sessionId });
            }
          } else if (
            signIn.firstFactorVerification?.status === 'transferable'
          ) {
            const dynamicUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const res = await signUp.create({
              transfer: true,
              username: dynamicUsername,
            });
            const sessionId = res.createdSessionId || '';
            if (sessionId && setSignUpActive) {
              await setSignUpActive({ session: sessionId });
            }
          }
        } catch (err) {
          console.warn('Failed to process OAuth params:', err);
        }
      }

      // 2. Trade the Clerk session for a Monevo token. Never store the Clerk
      // token itself: the API rejects it and the app would bounce back here.
      if (!(await completeSignIn(await getToken()))) {
        // Clerk may need a moment to expose the new session after setActive.
        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (await completeSignIn(await getToken())) return;
        }
      }

      if (!isMounted) return;
      router.replace(
        useAuthStore.getState().isAuthenticated ? '/(tabs)' : '/login',
      );
    }

    void handleAuthFlow();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [
    params.rotating_token_nonce,
    isSignInLoaded,
    isSignUpLoaded,
    isSignedIn,
    userId,
    user,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
