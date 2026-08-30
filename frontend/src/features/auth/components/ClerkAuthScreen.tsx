import React, { useState } from "react";
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
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { GoogleButton } from "./GoogleButton";

WebBrowser.maybeCompleteAuthSession();

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
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Send Email OTP Code
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Vui lòng nhập Email", "Hãy nhập địa chỉ email của bạn.");
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Try Signing in with Email Code (for existing users)
      try {
        const { supportedFirstFactors } = await signIn.create({
          identifier: email.trim(),
        });

        const emailCodeFactor = supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setStep("OTP");
          return;
        }
      } catch {
        // If user does not exist yet, create a sign-up attempt
      }

      // 2. Create Sign Up with Email Code (for new users)
      await signUp.create({
        emailAddress: email.trim(),
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setStep("OTP");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể gửi mã. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit OTP Code
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert("Thiếu mã", "Vui lòng nhập mã 6 số được gửi về email.");
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) return;

    setIsLoading(true);
    try {
      // Try verifying sign-in attempt first
      if (signIn.status === "needs_first_factor") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
          const token = result.createdSessionId || "clerk_token";
          loginStore(
            {
              id: result.createdSessionId || "user",
              email: email.trim(),
              name: result.userData?.firstName || "Monevo User",
            },
            token,
          );
          router.replace("/(tabs)");
          return;
        }
      }

      // Verify sign-up attempt
      if (signUp.status === "missing_requirements") {
        const result = await signUp.attemptEmailAddressVerification({
          code: code.trim(),
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          const token = (await result.createdSessionId) || "clerk_token";
          loginStore(
            {
              id: result.createdUserId || "user",
              email: email.trim(),
              name: result.firstName || "Monevo User",
            },
            token,
          );
          router.replace("/(tabs)");
          return;
        }
      }

      Alert.alert(
        "Mã không đúng",
        "Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Mã xác thực không đúng.";
      Alert.alert("Lỗi xác thực", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Google Sign-In
  const handleGooglePress = async () => {
    setIsGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
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
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="wallet" size={36} color={colors.surface} />
            </View>
            <Text style={styles.appTitle}>Monevo</Text>
            <Text style={styles.tagline}>
              {step === "EMAIL"
                ? "Đăng nhập nhanh không cần nhớ mật khẩu"
                : "Nhập mã xác thực được gửi về email"}
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {step === "EMAIL" ? (
              /* Step 1: Enter Email */
              <View>
                <Input
                  label="Địa chỉ Email của bạn"
                  placeholder="Ví dụ: nguyenvanan@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />

                <Button
                  title="Gửi mã đăng nhập ➜"
                  onPress={handleSendCode}
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
              /* Step 2: Enter 6-digit OTP */
              <View>
                <View style={styles.otpInfoBox}>
                  <Ionicons
                    name="mail-open-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.otpInfoText}>
                    Mã 6 số đã gửi tới:{" "}
                    <Text style={styles.otpEmailText}>{email}</Text>
                  </Text>
                </View>

                <Input
                  label="Mã xác nhận (6 chữ số)"
                  placeholder="Nhập 6 số..."
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoFocus
                />

                <Button
                  title="Xác nhận & Vào ứng dụng ✔"
                  onPress={handleVerifyCode}
                  isLoading={isLoading}
                  size="lg"
                  style={styles.mainButton}
                />

                <Pressable
                  onPress={() => setStep("EMAIL")}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.backButtonText}>Đổi email khác</Text>
                </Pressable>
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
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  appTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
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
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  otpInfoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  otpEmailText: {
    fontWeight: "700",
    color: colors.primaryDark,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: 6,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
