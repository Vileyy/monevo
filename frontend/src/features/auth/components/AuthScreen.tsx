import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useSSO, useUser } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { FaceIdIcon } from '@/components/FaceIdIcon';
import { useAuthStore } from '@/store/auth.store';
import { getBiometricSession } from '@/lib/biometrics';
import { hapticFeedback } from '@/lib/haptics';
import { openLegalPage } from '@/lib/legal-links';
import { authStyles } from '@/features/auth/styles/auth.styles';
import { GoogleButton } from './GoogleButton';
import {
  buildMissingProfileUpdate,
  extractClerkErrorMessage,
  getGoogleFallbackUser,
  resolveGoogleSessionId,
} from '../utils/auth-helpers';
import { buildSessionUser, exchangeClerkToken } from '../utils/session';

const logoMark = require('../../../../assets/images/logo-mark.png');

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const biometricAvailable = useAuthStore((state) => state.biometricAvailable);
  const biometricLabel = useAuthStore((state) => state.biometricLabel);
  const biometricIcon = useAuthStore((state) => state.biometricIcon);
  const refreshBiometricState = useAuthStore(
    (state) => state.refreshBiometricState,
  );
  const loginWithBiometrics = useAuthStore(
    (state) => state.loginWithBiometrics,
  );

  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { startSSOFlow } = useSSO();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [savedBiometricUser, setSavedBiometricUser] = useState<{
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      await refreshBiometricState();
      const session = await getBiometricSession();
      if (session?.user) {
        setSavedBiometricUser(session.user);
      }
    })();
  }, [refreshBiometricState]);

  const fetchClerkToken = useCallback(async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const t = await getToken();
        if (t) return t;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  }, [getToken]);

  const commitSession = useCallback(
    async (
      clerkToken: string,
      fallbackUser: {
        id: string;
        email: string;
        name: string;
        avatarUrl?: string;
      },
    ) => {
      const session = await exchangeClerkToken(clerkToken, fallbackUser.name);
      loginStore(buildSessionUser(session, fallbackUser), session.accessToken);
      router.replace('/(tabs)');
    },
    [loginStore, router],
  );

  // The API session can outlive the Clerk one (or be cleared by a network
  // hiccup). When Clerk still has a session, silently trade it for a new API
  // token instead of signing the user out and asking them to tap Google
  // again. Runs once per mount so it can never fight a fresh sign-in.
  const restoredClerkSessionRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || restoredClerkSessionRef.current) {
      return;
    }
    if (isGoogleLoading) return;
    if (!isSignedIn || useAuthStore.getState().isAuthenticated) return;
    restoredClerkSessionRef.current = true;

    void (async () => {
      setIsRestoringSession(true);
      try {
        const token = await fetchClerkToken();
        if (!token) return;

        await commitSession(token, {
          id: clerkUser?.id ?? '',
          email: clerkUser?.primaryEmailAddress?.emailAddress ?? '',
          name:
            clerkUser?.fullName ||
            [clerkUser?.firstName, clerkUser?.lastName]
              .filter(Boolean)
              .join(' ') ||
            'Monevo User',
          avatarUrl: clerkUser?.imageUrl || undefined,
        });
      } catch {
        // Keep the sign-in button available; the user can retry manually.
      } finally {
        if (mountedRef.current) setIsRestoringSession(false);
      }
    })();
  }, [
    isAuthLoaded,
    isUserLoaded,
    isGoogleLoading,
    isSignedIn,
    clerkUser,
    fetchClerkToken,
    commitSession,
  ]);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isBiometricLoading || isRestoringSession) return;

    hapticFeedback.light();
    setIsGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL('oauth-native-callback', {
        scheme: 'monevo',
      });

      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      let sessionId = resolveGoogleSessionId(result);

      if (!sessionId && result.signUp?.status === 'missing_requirements') {
        const update = buildMissingProfileUpdate(
          result.signUp.missingFields ?? [],
        );
        if (Object.keys(update).length > 0) {
          const updated = await result.signUp.update(update);
          if (updated.status === 'complete' && updated.createdSessionId) {
            sessionId = updated.createdSessionId;
          }
        }
      }

      const fallback = getGoogleFallbackUser(result);
      const commit = (token: string) =>
        commitSession(token, {
          id: sessionId ?? clerkUser?.id ?? '',
          email: clerkUser?.primaryEmailAddress?.emailAddress || fallback.email,
          name: clerkUser?.fullName || fallback.name,
          avatarUrl: clerkUser?.imageUrl || undefined,
        });

      if (!sessionId) {
        // Clerk returns no new session when the account is already active in
        // the browser. Continue with that session; a null token means the
        // user dismissed the sheet, so stay quiet.
        const existingToken = await getToken().catch(() => null);
        if (!existingToken) return;

        await commit(existingToken);
        hapticFeedback.success();
        return;
      }

      if (result.setActive) {
        await result.setActive({ session: sessionId });
      }

      const token = await fetchClerkToken();
      if (!token) {
        Alert.alert(
          'Session Error',
          'Could not obtain authentication token from Clerk. Please try again.',
        );
        return;
      }

      await commit(token);
      hapticFeedback.success();
    } catch (err: unknown) {
      hapticFeedback.error();
      Alert.alert(
        'Google Sign-In',
        extractClerkErrorMessage(
          err,
          'Could not sign in with Google. Please try again.',
        ),
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOpenLegalPage = async (
    page: 'privacy' | 'terms' | 'account-deletion',
  ) => {
    try {
      await openLegalPage(page);
    } catch (err) {
      Alert.alert(
        'Unavailable',
        err instanceof Error
          ? err.message
          : 'Could not open this page right now.',
      );
    }
  };

  const handleBiometricLogin = async () => {
    if (isBiometricLoading || isGoogleLoading) return;

    hapticFeedback.light();
    setIsBiometricLoading(true);
    try {
      const result = await loginWithBiometrics();
      if (result === 'success') {
        hapticFeedback.success();
        router.replace('/(tabs)');
      } else if (result === 'no-session') {
        Alert.alert(
          'No Saved Account',
          `Sign in once, then you can use ${biometricLabel} next time.`,
        );
      } else if (result === 'unavailable') {
        Alert.alert(
          `${biometricLabel} unavailable`,
          `Set up ${biometricLabel} in your device settings, then try again.`,
        );
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const biometricReady = biometricAvailable && !!savedBiometricUser;

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.brandSection}>
            <View style={authStyles.logoBadge}>
              <Image
                source={logoMark}
                style={authStyles.logoImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text style={authStyles.appName}>Monevo</Text>
            <Text style={authStyles.appTagline}>Sign in to continue</Text>
          </View>

          <View style={authStyles.card}>
            <View style={authStyles.primaryRow}>
              <View style={authStyles.googleCol}>
                <GoogleButton
                  onPress={() => void handleGoogleLogin()}
                  isLoading={isGoogleLoading}
                  disabled={
                    isGoogleLoading || isBiometricLoading || isRestoringSession
                  }
                />
              </View>

              {biometricReady && (
                <Pressable
                  onPress={() => void handleBiometricLogin()}
                  disabled={isBiometricLoading}
                  accessibilityRole="button"
                  accessibilityLabel={`Sign in with ${biometricLabel}`}
                  style={({ pressed }) => [
                    authStyles.biometricSquare,
                    pressed && authStyles.biometricSquarePressed,
                  ]}
                >
                  {isBiometricLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : biometricIcon === 'scan-outline' ? (
                    <FaceIdIcon size={24} color={colors.primary} />
                  ) : biometricIcon === 'finger-print-outline' ? (
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={24}
                      color={colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name={biometricIcon}
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              )}
            </View>

            {biometricReady && (
              <Text style={authStyles.biometricHint} numberOfLines={1}>
                Or continue as{' '}
                {savedBiometricUser.name || savedBiometricUser.email} with{' '}
                {biometricLabel}
              </Text>
            )}

            <Text style={authStyles.signInHint}>
              New here? Your account is created automatically, no password
              needed.
            </Text>
          </View>

          <View style={authStyles.legalFooter}>
            <Text style={authStyles.legalText} numberOfLines={1}>
              You agree to our{' '}
              <Text
                style={authStyles.legalLink}
                onPress={() => void handleOpenLegalPage('terms')}
                accessibilityRole="link"
              >
                Terms
              </Text>
              {' · '}
              <Text
                style={authStyles.legalLink}
                onPress={() => void handleOpenLegalPage('privacy')}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
              {' · '}
              <Text
                style={authStyles.legalLink}
                onPress={() => void handleOpenLegalPage('account-deletion')}
                accessibilityRole="link"
              >
                Delete account
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
