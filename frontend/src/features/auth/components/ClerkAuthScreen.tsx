import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { Button, Input, OtpInput } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { hapticFeedback } from "@/lib/haptics";
import { GoogleButton } from "./GoogleButton";

WebBrowser.maybeCompleteAuthSession();

type AuthFlow = "SIGN_IN" | "SIGN_UP";

export function ClerkAuthScreen() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);

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
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("SIGN_IN");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 60-second Resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send Email OTP Code
  const handleSendCode = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || email).trim().toLowerCase();
    if (!emailToUse) {
      hapticFeedback.warning();
      Alert.alert("Vui lòng nhập Email", "Hãy nhập địa chỉ email của bạn.");
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setCode("");

    try {
      // 1. Try Signing In flow first (if user exists)
      try {
        const signInAttempt = await signIn.create({
          identifier: emailToUse,
        });

        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code",
        );

        if (emailFactor && "emailAddressId" in emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setAuthFlow("SIGN_IN");
          setStep("OTP");
          setCountdown(60);
          hapticFeedback.success();
          return;
        }
      } catch {
        // User not found or needs sign-up, fall through to Sign Up
      }

      // 2. Create Sign Up flow (for new user)
      try {
        await signUp.create({
          emailAddress: emailToUse,
        });

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setAuthFlow("SIGN_UP");
        setStep("OTP");
        setCountdown(60);
        hapticFeedback.success();
      } catch (signUpErr: unknown) {
        // If signUp failed because user exists already, retry prepare on signIn
        if (
          signUpErr instanceof Error &&
          signUpErr.message.toLowerCase().includes("already exists")
        ) {
          const retrySignIn = await signIn.create({ identifier: emailToUse });
          const factor = retrySignIn.supportedFirstFactors?.find(
            (f) => f.strategy === "email_code",
          );
          if (factor && "emailAddressId" in factor) {
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: factor.emailAddressId,
            });
            setAuthFlow("SIGN_IN");
            setStep("OTP");
            setCountdown(60);
            hapticFeedback.success();
            return;
          }
        }
        throw signUpErr;
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể gửi mã. Vui lòng kiểm tra lại email.";
      Alert.alert("Lỗi gửi mã", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit OTP Code
  const handleVerifyCode = async (customCode?: string) => {
    const raw = customCode || code;
    const cleanCode = raw.replace(/\D/g, "").trim();

    if (cleanCode.length !== 6) {
      hapticFeedback.warning();
      Alert.alert(
        "Mã không hợp lệ",
        "Vui lòng nhập đủ 6 chữ số được gửi về email.",
      );
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Flow 1: Verify via Sign In
      if (authFlow === "SIGN_IN" && signIn.status === "needs_first_factor") {
        try {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: cleanCode,
          });

          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
            hapticFeedback.success();
            loginStore(
              {
                id: result.createdSessionId,
                email: email.trim().toLowerCase(),
                name: result.userData?.firstName || "Monevo User",
              },
              result.createdSessionId,
            );
            router.replace("/(tabs)");
            return;
          }
        } catch {
          // If signIn attempt fails, try signUp verification as fallback
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
          loginStore(
            {
              id: result.createdUserId || result.createdSessionId,
              email: email.trim().toLowerCase(),
              name: result.firstName || "Monevo User",
            },
            result.createdSessionId,
          );
          router.replace("/(tabs)");
          return;
        }
      } catch {
        // Fallback retry with signIn if signUp fails
        if (signIn.status === "needs_first_factor") {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: cleanCode,
          });

          if (result.status === "complete" && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
            hapticFeedback.success();
            loginStore(
              {
                id: result.createdSessionId,
                email: email.trim().toLowerCase(),
                name: result.userData?.firstName || "Monevo User",
              },
              result.createdSessionId,
            );
            router.replace("/(tabs)");
            return;
          }
        }
      }

      setHasError(true);
      hapticFeedback.error();
      Alert.alert(
        "Mã không đúng",
        "Mã xác thực bạn vừa nhập không khớp hoặc đã hết hạn. Vui lòng kiểm tra lại email mới nhất.",
      );
    } catch (err: unknown) {
      setHasError(true);
      hapticFeedback.error();
      const msg =
        err instanceof Error ? err.message : "Mã xác thực không chính xác.";
      Alert.alert("Lỗi xác thực", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Google Sign-In
  const handleGooglePress = async () => {
    hapticFeedback.light();
    setIsGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        hapticFeedback.success();
        loginStore(
          {
            id: createdSessionId,
            email: "google.user@clerk.dev",
            name: "Google Member",
          },
          createdSessionId,
        );
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg =
        err instanceof Error ? err.message : "Không thể đăng nhập bằng Google.";
      Alert.alert("Google Login", msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="wallet" size={38} color={colors.surface} />
            </View>
            <Text style={styles.appTitle}>Monevo</Text>
            <Text style={styles.tagline}>
              {step === "EMAIL"
                ? "Đăng nhập an toàn, tiện lợi & không cần mật khẩu"
                : "Nhập mã 6 chữ số được gửi tới hộp thư của bạn"}
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {step === "EMAIL" ? (
              /* ================= STEP 1: ENTER EMAIL ================= */
              <View>
                <Input
                  label="Địa chỉ Email"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setHasError(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                  }
                />

                <Button
                  title="Gửi mã đăng nhập ➜"
                  onPress={() => void handleSendCode()}
                  isLoading={isLoading}
                  size="lg"
                  style={styles.mainButton}
                />

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>HOẶC</Text>
                  <View style={styles.dividerLine} />
                </View>

                <GoogleButton
                  onPress={handleGooglePress}
                  isLoading={isGoogleLoading}
                />
              </View>
            ) : (
              /* ================= STEP 2: ENTER OTP ================= */
              <View>
                {/* Email Info Badge */}
                <View style={styles.otpInfoBox}>
                  <Ionicons
                    name="mail-open"
                    size={22}
                    color={colors.primaryDark}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpInfoText}>
                      Mã xác nhận đã gửi đến:
                    </Text>
                    <Text style={styles.otpEmailText} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticFeedback.light();
                      setStep("EMAIL");
                    }}
                    hitSlop={8}
                    style={styles.editEmailBtn}
                  >
                    <Ionicons name="pencil" size={13} color={colors.primary} />
                  </Pressable>
                </View>

                {/* 6-Box Animated OtpInput */}
                <OtpInput
                  code={code}
                  onCodeChange={(newCode) => {
                    setCode(newCode);
                    setHasError(false);
                  }}
                  onFilled={(filledCode) => {
                    void handleVerifyCode(filledCode);
                  }}
                  hasError={hasError}
                  disabled={isLoading}
                />

                {/* Confirm Button */}
                <Button
                  title="Xác nhận & Vào ứng dụng ✔"
                  onPress={() => void handleVerifyCode()}
                  isLoading={isLoading}
                  size="lg"
                  style={styles.mainButton}
                />

                {/* Resend Code & Back Row */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>
                      Gửi lại mã sau ({countdown}s)
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => void handleSendCode()}
                      disabled={isLoading}
                      hitSlop={8}
                      style={styles.resendBtn}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={15}
                        color={colors.primary}
                      />
                      <Text style={styles.resendText}>Gửi lại mã OTP</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: radius.xxl,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  appTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 290,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  mainButton: {
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  otpInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  otpInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  otpEmailText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: 1,
  },
  editEmailBtn: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  countdownText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resendText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
});
