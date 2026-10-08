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
import { useAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { Button, Input, OtpInput } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/services/api/client";
import { hapticFeedback } from "@/lib/haptics";
import { authStyles } from "@/features/auth/styles/auth.styles";
import {
  extractClerkErrorMessage,
  isRateLimitError,
  isSessionExistsError,
  isUserExistsError,
  isValidEmailFormat,
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
  const { getToken, signOut, isSignedIn } = useAuth();

  // Screen state
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [otpFlow, setOtpFlow] = useState<OtpAuthFlow>("SIGN_IN");
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [otpCode, setOtpCode] = useState("");
  const [hasOtpError, setHasOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // If user navigated to AuthScreen while Clerk still has a stale session, sign out cleanly
  useEffect(() => {
    if (isSignedIn) {
      void (async () => {
        try {
          await signOut();
        } catch {}
      })();
    }
  }, [isSignedIn, signOut]);

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
      fallbackUser: { id: string; email: string; name: string },
    ) => {
      try {
        const res = await apiClient.post<{
          user: { id: string; email: string; name?: string };
          accessToken: string;
        }>("/auth/clerk", { clerkToken });
        if (res.data?.accessToken && res.data?.user) {
          loginStore(res.data.user, res.data.accessToken);
          router.replace("/(tabs)");
          return;
        }
      } catch (err) {
        console.warn("Failed to exchange clerk token, falling back:", err);
      }
      loginStore(fallbackUser, clerkToken);
      router.replace("/(tabs)");
    };

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
              {step === "EMAIL"
                ? "Sign in quickly and securely with an email verification code"
                : "Enter the 6-digit verification code sent to your email"}
            </Text>
          </View>

          {/* Main Card */}
          <View style={authStyles.card}>
            {step === "EMAIL" ? (
              /* ================= STEP 1: ENTER EMAIL ================= */
              <View style={authStyles.form}>
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
                  autoFocus
                  clearable
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSendOtpCode()}
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={colors.primary}
                    />
                  }
                />

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
