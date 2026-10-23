import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useSignIn, useSignUp, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { Button, Input, OtpInput } from "@/components/ui";
import { FaceIdIcon } from "@/components/FaceIdIcon";
import { useAuthStore } from "@/store/auth.store";
import { getBiometricSession } from "@/lib/biometrics";
import { apiClient } from "@/services/api/client";
import { hapticFeedback } from "@/lib/haptics";
import { apiErrorMessage } from "@/lib/api-error";
import { openLegalPage } from "@/lib/legal-links";
import { authStyles } from "@/features/auth/styles/auth.styles";
import { GoogleButton } from "./GoogleButton";
import { loginWithPassword } from "../utils/password-login";
import {
  buildMissingProfileUpdate,
  extractClerkErrorMessage,
  getGoogleFallbackUser,
  isRateLimitError,
  isSessionExistsError,
  isUserExistsError,
  isValidEmailFormat,
  resolveGoogleSessionId,
} from "../utils/auth-helpers";

WebBrowser.maybeCompleteAuthSession();

type OtpAuthFlow = "SIGN_IN" | "SIGN_UP";

export interface AuthScreenProps {
  initialMethod?: string;
  initialAccountMode?: string;
  initialEmail?: string;
}

export function AuthScreen({ initialEmail = "" }: AuthScreenProps) {
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

  // Clerk hooks
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
  const { getToken, signOut, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { startSSOFlow } = useSSO();

  // Screen state
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [otpFlow, setOtpFlow] = useState<OtpAuthFlow>("SIGN_IN");
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [otpCode, setOtpCode] = useState("");
  const [hasOtpError, setHasOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [authMethod, setAuthMethod] = useState<"CODE" | "PASSWORD">("CODE");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
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

  // 60-second countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Prevent rapid double-tap or concurrent submissions
  const isSendingRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Validate email address
  const validateEmail = (inputEmail: string) => {
    const trimmed = inputEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("Please enter your email address");
      return false;
    }
    if (!isValidEmailFormat(trimmed)) {
      setEmailError("Invalid email address format");
      return false;
    }
    setEmailError(undefined);
    return true;
  };

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
      }>("/auth/clerk", { clerkToken, name: fallbackUser.name });
      if (res.data?.accessToken && res.data?.user) {
        loginStore(
          {
            ...res.data.user,
            name:
              res.data.user.name &&
              res.data.user.name !== "Monevo Member" &&
              res.data.user.name !== "Google User"
                ? res.data.user.name
                : fallbackUser.name,
            avatarUrl: fallbackUser.avatarUrl,
          },
          res.data.accessToken,
        );
        router.replace("/(tabs)");
        return;
      }
    } catch (err) {
      console.warn("Failed to exchange clerk token, falling back:", err);
    }
    loginStore(fallbackUser, clerkToken);
    router.replace("/(tabs)");
  };

  // Send Email OTP Code
  const handleSendOtpCode = async (targetEmail?: string) => {
    if (isSendingRef.current || isLoading) {
      return;
    }

    const emailToUse = (targetEmail || email).trim().toLowerCase();
    if (!validateEmail(emailToUse)) {
      hapticFeedback.warning();
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) {
      Alert.alert(
        "Notice",
        "Authentication service is initializing. Please try again shortly.",
      );
      return;
    }

    isSendingRef.current = true;
    setIsLoading(true);
    setHasOtpError(false);
    setOtpCode("");

    try {
      // Clear any lingering session in Clerk before creating a new factor
      if (isSignedIn) {
        try {
          await signOut();
        } catch {}
      }

      let codeSent = false;

      // 1. Try Signing In flow first (if user exists in Clerk)
      try {
        const signInAttempt = await signIn.create({
          identifier: emailToUse,
        });

        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code",
        );

        if (emailFactor && "emailAddressId" in emailFactor) {
          try {
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });
            setOtpFlow("SIGN_IN");
            setStep("OTP");
            setCountdown(60);
            hapticFeedback.success();
            codeSent = true;
            return;
          } catch (factorErr: unknown) {
            if (isRateLimitError(factorErr)) {
              setOtpFlow("SIGN_IN");
              setStep("OTP");
              setCountdown(60);
              hapticFeedback.success();
              codeSent = true;
              Alert.alert(
                "Code Already Sent",
                "A verification code was recently sent to your email. Please check your inbox or wait before requesting a new one.",
              );
              return;
            }
            throw factorErr;
          }
        }
      } catch (signInErr: unknown) {
        if (isRateLimitError(signInErr)) {
          if (signIn.status === "needs_first_factor") {
            setOtpFlow("SIGN_IN");
            setStep("OTP");
            setCountdown(60);
            hapticFeedback.success();
            Alert.alert(
              "Code Already Sent",
              "A verification code was recently sent to your email. Please check your inbox.",
            );
            return;
          }
          throw signInErr;
        }

        if (isSessionExistsError(signInErr)) {
          try {
            await signOut();
            isSendingRef.current = false;
            return handleSendOtpCode(targetEmail);
          } catch {}
        }
      }

      // 2. Try Sign Up flow (for new user)
      if (!codeSent) {
        try {
          await signUp.create({
            emailAddress: emailToUse,
          });

          try {
            await signUp.prepareEmailAddressVerification({
              strategy: "email_code",
            });
            setOtpFlow("SIGN_UP");
            setStep("OTP");
            setCountdown(60);
            hapticFeedback.success();
          } catch (prepErr: unknown) {
            if (isRateLimitError(prepErr)) {
              setOtpFlow("SIGN_UP");
              setStep("OTP");
              setCountdown(60);
              hapticFeedback.success();
              Alert.alert(
                "Code Already Sent",
                "A verification code was recently sent to your email. Please check your inbox.",
              );
              return;
            }
            throw prepErr;
          }
        } catch (signUpErr: unknown) {
          if (isRateLimitError(signUpErr)) {
            if (signIn.status === "needs_first_factor") {
              setOtpFlow("SIGN_IN");
              setStep("OTP");
              setCountdown(60);
              hapticFeedback.success();
              Alert.alert(
                "Code Already Sent",
                "A verification code was recently sent to your email. Please check your inbox.",
              );
              return;
            }
          }

          if (isUserExistsError(signUpErr)) {
            // User exists already, retry signIn factor preparation
            try {
              const retrySignIn = await signIn.create({
                identifier: emailToUse,
              });
              const factor = retrySignIn.supportedFirstFactors?.find(
                (f) => f.strategy === "email_code",
              );
              if (factor && "emailAddressId" in factor) {
                try {
                  await signIn.prepareFirstFactor({
                    strategy: "email_code",
                    emailAddressId: factor.emailAddressId,
                  });
                } catch (retryFactorErr: unknown) {
                  if (isRateLimitError(retryFactorErr)) {
                    // Factor already generated/sent
                  } else {
                    throw retryFactorErr;
                  }
                }
                setOtpFlow("SIGN_IN");
                setStep("OTP");
                setCountdown(60);
                hapticFeedback.success();
                return;
              }
            } catch (retryErr: unknown) {
              if (isRateLimitError(retryErr)) {
                setOtpFlow("SIGN_IN");
                setStep("OTP");
                setCountdown(60);
                hapticFeedback.success();
                Alert.alert(
                  "Code Already Sent",
                  "A verification code was recently sent to your email. Please check your inbox.",
                );
                return;
              }
            }
          }

          throw signUpErr;
        }
      }
    } catch (err: unknown) {
      if (isSessionExistsError(err)) {
        try {
          await signOut();
          isSendingRef.current = false;
          return handleSendOtpCode(targetEmail);
        } catch {}
      }

      hapticFeedback.error();

      if (isRateLimitError(err)) {
        Alert.alert(
          "Too Many Requests",
          "A verification code may have already been sent to your email. Would you like to enter the code you received?",
          [
            {
              text: "Enter Code",
              onPress: () => {
                setStep("OTP");
                setCountdown(60);
              },
            },
            {
              text: "Wait",
              style: "cancel",
            },
          ],
        );
      } else {
        const msg = extractClerkErrorMessage(
          err,
          "Could not send verification code. Please check your email.",
        );
        Alert.alert("Failed to Send Code", msg);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isSendingRef.current = false;
      }, 1000);
    }
  };

  // Verify 6-digit OTP Code
  const handleVerifyOtpCode = async (customCode?: string) => {
    if (isVerifyingRef.current || isLoading) return;

    const raw = customCode || otpCode;
    const cleanCode = raw.replace(/\D/g, "").trim();

    if (cleanCode.length !== 6) {
      hapticFeedback.warning();
      Alert.alert(
        "Invalid Code",
        "Please enter all 6 digits sent to your email.",
      );
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) return;

    isVerifyingRef.current = true;
    setIsLoading(true);
    setHasOtpError(false);

    try {
      // Flow 1: Verify via Sign In
      if (otpFlow === "SIGN_IN" && signIn.status === "needs_first_factor") {
        try {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: cleanCode,
          });

          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
            hapticFeedback.success();
            const token = await fetchClerkToken();
            if (!token) {
              Alert.alert(
                "Session Error",
                "Could not obtain authentication token from Clerk. Please try again.",
              );
              return;
            }
            await commitSession(token, {
              id: result.createdSessionId,
              email: email.trim().toLowerCase(),
              name: result.userData?.firstName || "Monevo User",
            });
            return;
          }
        } catch (signInErr: unknown) {
          const codeErr = (signInErr as { errors?: { code: string }[] })
            ?.errors?.[0]?.code;
          if (
            codeErr === "form_code_incorrect" ||
            codeErr === "verification_failed"
          ) {
            throw signInErr;
          }
        }
      }

      // Flow 2: Verify via Sign Up
      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: cleanCode,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          hapticFeedback.success();
          const token = await fetchClerkToken();
          if (!token) {
            Alert.alert(
              "Session Error",
              "Could not obtain authentication token from Clerk. Please try again.",
            );
            return;
          }
          await commitSession(token, {
            id: result.createdUserId || result.createdSessionId,
            email: email.trim().toLowerCase(),
            name: result.firstName || "Monevo User",
          });
          return;
        }

        // If email is verified but missing fields requirement in Clerk
        if (result.status === "missing_requirements") {
          const missing = (result.missingFields || []) as string[];
          try {
            const dynamicPass = `Monevo@${Date.now()}Aa1!`;
            const dynamicUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const updatePayload: Record<string, string> = {};
            if (missing.includes("password")) {
              updatePayload.password = dynamicPass;
            }
            if (missing.includes("username")) {
              updatePayload.username = dynamicUsername;
            }
            if (missing.includes("first_name")) {
              updatePayload.firstName = "Monevo";
            }
            if (missing.includes("last_name")) {
              updatePayload.lastName = "User";
            }

            if (Object.keys(updatePayload).length > 0) {
              const updateRes = await signUp.update(updatePayload);
              if (
                updateRes.status === "complete" &&
                updateRes.createdSessionId
              ) {
                await setSignUpActive({ session: updateRes.createdSessionId });
                hapticFeedback.success();
                const token = await fetchClerkToken();
                if (!token) {
                  Alert.alert(
                    "Session Error",
                    "Could not obtain authentication token from Clerk. Please try again.",
                  );
                  return;
                }
                await commitSession(token, {
                  id: updateRes.createdUserId || updateRes.createdSessionId,
                  email: email.trim().toLowerCase(),
                  name: "Monevo User",
                });
                return;
              }
            }
          } catch (updateErr) {
            console.warn("Error auto-filling missing Clerk fields:", updateErr);
          }
        }
      } catch (signUpErr: unknown) {
        // Fallback retry with signIn if signUp failed
        if (signIn.status === "needs_first_factor") {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: cleanCode,
          });

          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
            hapticFeedback.success();
            const token = await fetchClerkToken();
            if (!token) {
              Alert.alert(
                "Session Error",
                "Could not obtain authentication token from Clerk. Please try again.",
              );
              return;
            }
            await commitSession(token, {
              id: result.createdSessionId,
              email: email.trim().toLowerCase(),
              name: result.userData?.firstName || "Monevo User",
            });
            return;
          }
        }
        throw signUpErr;
      }

      setHasOtpError(true);
      hapticFeedback.error();
      Alert.alert(
        "Incorrect Code",
        "The verification code you entered is invalid or has expired. Please check your latest email.",
      );
    } catch (err: unknown) {
      setHasOtpError(true);
      hapticFeedback.error();
      const clerkError = (
        err as { errors?: { longMessage?: string; message?: string }[] }
      )?.errors?.[0];
      const msg =
        clerkError?.longMessage ||
        clerkError?.message ||
        (err instanceof Error
          ? err.message
          : "Verification code is incorrect.");
      Alert.alert("Verification Error", msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isVerifyingRef.current = false;
      }, 500);
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isLoading) return;

    hapticFeedback.light();
    setIsGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL("oauth-native-callback", {
        scheme: "monevo",
      });

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      let sessionId = resolveGoogleSessionId(result);

      if (!sessionId && result.signUp?.status === "missing_requirements") {
        const update = buildMissingProfileUpdate(
          result.signUp.missingFields ?? [],
        );
        if (Object.keys(update).length > 0) {
          const updated = await result.signUp.update(update);
          if (updated.status === "complete" && updated.createdSessionId) {
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
          "Session Error",
          "Could not obtain authentication token from Clerk. Please try again.",
        );
        return;
      }

      const fallback = getGoogleFallbackUser(result);
      await commitSession(token, { id: sessionId, ...fallback });
    } catch (err: unknown) {
      hapticFeedback.error();
      Alert.alert(
        "Google Sign-In",
        extractClerkErrorMessage(
          err,
          "Could not sign in with Google. Please try again.",
        ),
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (isPasswordLoading || isLoading) return;

    const targetEmail = email.trim().toLowerCase();
    if (!validateEmail(targetEmail)) {
      hapticFeedback.warning();
      return;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      hapticFeedback.warning();
      return;
    }

    setIsPasswordLoading(true);
    try {
      const result = await loginWithPassword(targetEmail, password);
      loginStore(result.user, result.accessToken);
      hapticFeedback.success();
      router.replace("/(tabs)");
    } catch (err: unknown) {
      hapticFeedback.error();
      setPasswordError(
        err instanceof Error ? err.message : "Could not sign in.",
      );
      Alert.alert(
        "Sign-In Failed",
        apiErrorMessage(err, "Incorrect email or password."),
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleOpenLegalPage = async (
    page: "privacy" | "terms" | "account-deletion",
  ) => {
    try {
      await openLegalPage(page);
    } catch (err) {
      Alert.alert(
        "Unavailable",
        err instanceof Error
          ? err.message
          : "Could not open this page right now.",
      );
    }
  };

  const handleBiometricLogin = async () => {
    if (isBiometricLoading) return;

    hapticFeedback.light();
    setIsBiometricLoading(true);
    try {
      const result = await loginWithBiometrics();
      if (result === "success") {
        hapticFeedback.success();
        router.replace("/(tabs)");
      } else if (result === "no-session") {
        Alert.alert(
          "No Saved Account",
          `Sign in with your email once, then you can use ${biometricLabel} next time.`,
        );
      } else if (result === "unavailable") {
        Alert.alert(
          `${biometricLabel} unavailable`,
          `Set up ${biometricLabel} in your device settings, then try again.`,
        );
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={authStyles.brandSection}>
            <View style={authStyles.logoBadge}>
              <Ionicons name="wallet" size={34} color={colors.surface} />
            </View>
            <Text style={authStyles.appName}>Monevo</Text>
            <Text style={authStyles.appTagline}>
              {step === "OTP"
                ? "Enter the 6-digit verification code sent to your email"
                : authMethod === "PASSWORD"
                  ? "Sign in with your email and password"
                  : "Sign in quickly and securely with an email verification code"}
            </Text>
          </View>

          {/* Main Card */}
          <View style={authStyles.card}>
            {step === "EMAIL" ? (
              /* ================= STEP 1: ENTER EMAIL ================= */
              <View style={authStyles.form}>
                {biometricAvailable && savedBiometricUser && (
                  <>
                    <Pressable
                      style={authStyles.biometricQuickCard}
                      onPress={() => void handleBiometricLogin()}
                      disabled={isBiometricLoading}
                      accessibilityRole="button"
                      accessibilityLabel={`Sign in with ${biometricLabel}`}
                    >
                      <View style={authStyles.biometricQuickIcon}>
                        {isBiometricLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : biometricIcon === "scan-outline" ? (
                          <FaceIdIcon size={26} color={colors.primary} />
                        ) : biometricIcon === "finger-print-outline" ? (
                          <MaterialCommunityIcons
                            name="fingerprint"
                            size={26}
                            color={colors.primary}
                          />
                        ) : (
                          <Ionicons
                            name={biometricIcon}
                            size={24}
                            color={colors.primary}
                          />
                        )}
                      </View>
                      <View style={authStyles.biometricQuickTextCol}>
                        <Text style={authStyles.biometricQuickTitle}>
                          Sign in with {biometricLabel}
                        </Text>
                        <Text
                          style={authStyles.biometricQuickSubtitle}
                          numberOfLines={1}
                        >
                          Continue as{" "}
                          {savedBiometricUser.name || savedBiometricUser.email}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>

                    <View style={authStyles.biometricDividerRow}>
                      <View style={authStyles.dividerLine} />
                      <Text style={authStyles.dividerText}>
                        OR SIGN IN WITH EMAIL
                      </Text>
                      <View style={authStyles.dividerLine} />
                    </View>
                  </>
                )}

                <View style={authStyles.emailRow}>
                  <View style={authStyles.emailField}>
                    <Input
                      label="Email Address"
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError(undefined);
                      }}
                      error={emailError}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      clearable
                      returnKeyType={authMethod === "PASSWORD" ? "go" : "send"}
                      onSubmitEditing={() => {
                        if (authMethod === "PASSWORD") {
                          void handlePasswordLogin();
                        } else {
                          void handleSendOtpCode();
                        }
                      }}
                      leftIcon={
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={colors.primary}
                        />
                      }
                    />
                  </View>

                  {biometricAvailable && (
                    <Pressable
                      onPress={() => void handleBiometricLogin()}
                      disabled={isBiometricLoading}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Sign in with ${biometricLabel}`}
                      style={({ pressed }) => [
                        authStyles.biometricIconButton,
                        pressed && authStyles.biometricIconButtonPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={["#F0FDFA", "#CCFBF1"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={authStyles.biometricIconGradient}
                      >
                        {isBiometricLoading ? (
                          <ActivityIndicator size="small" color="#0F172A" />
                        ) : biometricIcon === "scan-outline" ? (
                          <FaceIdIcon size={25} color="#0F172A" />
                        ) : biometricIcon === "finger-print-outline" ? (
                          <MaterialCommunityIcons
                            name="fingerprint"
                            size={25}
                            color="#0F172A"
                          />
                        ) : (
                          <Ionicons
                            name={biometricIcon}
                            size={23}
                            color="#0F172A"
                          />
                        )}
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>

                {authMethod === "PASSWORD" ? (
                  <>
                    <Input
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError(undefined);
                      }}
                      error={passwordError}
                      isPassword
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="go"
                      textContentType="password"
                      onSubmitEditing={() => void handlePasswordLogin()}
                      leftIcon={
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={colors.primary}
                        />
                      }
                    />

                    <Button
                      title="Sign In"
                      onPress={() => void handlePasswordLogin()}
                      isLoading={isPasswordLoading}
                      size="lg"
                      style={authStyles.submitButton}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      title="Send Login Code ➜"
                      onPress={() => void handleSendOtpCode()}
                      isLoading={isLoading}
                      size="lg"
                      style={authStyles.submitButton}
                    />

                    <View style={authStyles.helperBadge}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={authStyles.helperText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        A verification code will be sent to your email
                      </Text>
                    </View>
                  </>
                )}

                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    setAuthMethod((current) =>
                      current === "CODE" ? "PASSWORD" : "CODE",
                    );
                    setPasswordError(undefined);
                  }}
                  style={authStyles.backToEmailBtn}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.backToEmailText}>
                    {authMethod === "CODE"
                      ? "Sign in with a password instead"
                      : "Use an email verification code instead"}
                  </Text>
                </Pressable>

                <View style={authStyles.dividerRow}>
                  <View style={authStyles.dividerLine} />
                  <Text style={authStyles.dividerText}>OR</Text>
                  <View style={authStyles.dividerLine} />
                </View>

                <GoogleButton
                  onPress={() => void handleGoogleLogin()}
                  isLoading={isGoogleLoading}
                  disabled={isLoading || isGoogleLoading || isPasswordLoading}
                />
              </View>
            ) : (
              /* ================= STEP 2: ENTER OTP ================= */
              <View style={authStyles.form}>
                {/* Email info banner with quick edit icon */}
                <View style={authStyles.otpInfoBox}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={authStyles.otpInfoText}>
                      Verification code sent to:
                    </Text>
                    <Text style={authStyles.otpEmailText} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticFeedback.light();
                      setStep("EMAIL");
                      setHasOtpError(false);
                    }}
                    hitSlop={8}
                    style={authStyles.editEmailBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Change email address"
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={15}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>

                {/* 6-digit OTP code input */}
                <OtpInput
                  code={otpCode}
                  onCodeChange={(newCode) => {
                    setOtpCode(newCode);
                    setHasOtpError(false);
                  }}
                  onFilled={(filledCode) => {
                    void handleVerifyOtpCode(filledCode);
                  }}
                  hasError={hasOtpError}
                  disabled={isLoading}
                />

                {/* Countdown, Resend button, or verifying spinner */}
                <View style={authStyles.resendRow}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : countdown > 0 ? (
                    <Text style={authStyles.countdownText}>
                      Resend code in ({countdown}s)
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => void handleSendOtpCode()}
                      disabled={isLoading}
                      hitSlop={8}
                      style={authStyles.resendBtn}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={15}
                        color={colors.primary}
                      />
                      <Text style={authStyles.resendText}>Resend OTP Code</Text>
                    </Pressable>
                  )}
                </View>

                {/* Return to email input */}
                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    setStep("EMAIL");
                    setHasOtpError(false);
                  }}
                  hitSlop={8}
                  style={authStyles.backToEmailBtn}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.backToEmailText}>
                    ← Use a different email address
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={authStyles.legalFooter}>
            <Text style={authStyles.legalText}>
              By continuing, you agree to our{" "}
              <Text
                style={authStyles.legalLink}
                onPress={() => void handleOpenLegalPage("terms")}
                accessibilityRole="link"
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={authStyles.legalLink}
                onPress={() => void handleOpenLegalPage("privacy")}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
              .
            </Text>
            <Pressable
              onPress={() => void handleOpenLegalPage("account-deletion")}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Text style={authStyles.legalLink}>
                How to delete your account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
