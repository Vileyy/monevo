import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { FaceIdIcon } from '@/components/FaceIdIcon';
import { useAuthStore } from '@/store/auth.store';
import { getBiometricSession } from '@/lib/biometrics';
import { apiClient } from '@/services/api/client';
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

  const { getToken, signOut, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { startSSOFlow } = useSSO();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [savedBiometricUser, setSavedBiometricUser] = useState<{
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  } | null>(null);

  // Sign out a stale Clerk session only once, on entry. A reactive check would
  // also fire right after a fresh sign-in and invalidate the new session.
  const cleanedStaleSessionRef = useRef(false);
  useEffect(() => {
    if (!isAuthLoaded || cleanedStaleSessionRef.current) return;
    cleanedStaleSessionRef.current = true;
    if (isSignedIn && !useAuthStore.getState().isAuthenticated) {
      void (async () => {
        try {
          await signOut();
        } catch {}
      })();
    }
  }, [isAuthLoaded, isSignedIn, signOut]);

  useEffect(() => {
    void (async () => {
      await refreshBiometricState();
      const session = await getBiometricSession();
      if (session?.user) {
        setSavedBiometricUser(session.user);
      }
    })();
  }, [refreshBiometricState]);

  const fetchClerkToken = async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const t = await getToken();
        if (t) return t;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  };

  const commitSession = async (
    clerkToken: string,
    fallbackUser: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
    },
  ) => {
    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; name?: string };
        accessToken: string;
      }>('/auth/clerk', { clerkToken, name: fallbackUser.name });
      if (res.data?.accessToken && res.data?.user) {
        loginStore(
          {
            ...res.data.user,
            name:
              res.data.user.name &&
              res.data.user.name !== 'Monevo Member' &&
              res.data.user.name !== 'Google User'
                ? res.data.user.name
                : fallbackUser.name,
            avatarUrl: fallbackUser.avatarUrl,
          },
          res.data.accessToken,
        );
        router.replace('/(tabs)');
        return;
      }
    } catch (err) {
      console.warn('Failed to exchange clerk token, falling back:', err);
    }
    loginStore(fallbackUser, clerkToken);
    router.replace('/(tabs)');
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isBiometricLoading) return;

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

      if (!sessionId) return;

      if (result.setActive) {
        await result.setActive({ session: sessionId });
      }

      hapticFeedback.success();
      const token = await fetchClerkToken();
      if (!token) {
        Alert.alert(
          'Session Error',
          'Could not obtain authentication token from Clerk. Please try again.',
        );
        return;
      }

      const fallback = getGoogleFallbackUser(result);
      await commitSession(token, { id: sessionId, ...fallback });
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
          `Sign in with Google once, then you can use ${biometricLabel} next time.`,
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
              <Ionicons name="wallet" size={34} color={colors.surface} />
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
                  disabled={isGoogleLoading || isBiometricLoading}
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
          </View>

          <View style={authStyles.legalFooter}>
            <Text style={authStyles.legalText}>
              By continuing, you agree to our{' '}
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
