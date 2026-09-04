import React, { useEffect, useState } from "react";
import {
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
import { useAuth, useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { Button, Input, OtpInput, SegmentedControl } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/services/api/client";
import { apiErrorMessage } from "@/lib/api-error";
import { hapticFeedback } from "@/lib/haptics";
import { authStyles } from "@/features/auth/styles/auth.styles";
import { GoogleButton } from "./GoogleButton";

WebBrowser.maybeCompleteAuthSession();

export type AuthMethod = "account" | "otp";
export type AccountMode = "login" | "register";
type OtpAuthFlow = "SIGN_IN" | "SIGN_UP";

export interface AuthScreenProps {
  initialMethod?: AuthMethod;
  initialAccountMode?: AccountMode;
}

export function AuthScreen({
  initialMethod = "account",
  initialAccountMode = "login",
}: AuthScreenProps) {
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
  const { getToken } = useAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });

  // UI state
  const [authMethod, setAuthMethod] = useState<AuthMethod>(initialMethod);
  const [accountMode, setAccountMode] =
    useState<AccountMode>(initialAccountMode);
  const [otpStep, setOtpStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [otpFlow, setOtpFlow] = useState<OtpAuthFlow>("SIGN_IN");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasOtpError, setHasOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  // Warm up browser on Android
  useEffect(() => {
    if (Platform.OS === "android") {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

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

  // Validation for Account (Password) Login & Register
  const validateAccountForm = () => {
    const nextErrors: { name?: string; email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (accountMode === "register" && !trimmedName) {
      nextErrors.name = "Vui lòng nhập họ và tên";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Vui lòng nhập địa chỉ email";
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email = "Địa chỉ email không hợp lệ";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (accountMode === "register" && password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit Account Login / Register (Email + Password)
  const handleAccountSubmit = async () => {
    if (!validateAccountForm()) {
      hapticFeedback.warning();
      return;
    }

    setIsLoading(true);
    hapticFeedback.selection();

    try {
      const endpoint =
        accountMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        accountMode === "login"
          ? { email: email.trim().toLowerCase(), password }
          : { email: email.trim().toLowerCase(), password, name: name.trim() };

      const response = await apiClient.post(endpoint, payload);
      const { user, accessToken } = response.data;

      if (!accessToken) {
        Alert.alert("Lỗi", "Không nhận được mã xác thực từ máy chủ.");
        return;
      }

      hapticFeedback.success();
      loginStore(user, accessToken);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      hapticFeedback.error();
      const title =
        accountMode === "login" ? "Đăng nhập thất bại" : "Đăng ký thất bại";
      const fallback =
        accountMode === "login"
          ? "Email hoặc mật khẩu không chính xác. Vui lòng thử lại."
          : "Không thể tạo tài khoản. Vui lòng thử lại.";
      Alert.alert(title, apiErrorMessage(error, fallback));
    } finally {
      setIsLoading(false);
    }
  };

  // Send Email OTP Code
  const handleSendOtpCode = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || email).trim().toLowerCase();
    if (!emailToUse || !/\S+@\S+\.\S+/.test(emailToUse)) {
      hapticFeedback.warning();
      Alert.alert(
        "Email không hợp lệ",
        "Vui lòng nhập địa chỉ email chính xác.",
      );
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) {
      Alert.alert(
        "Thông báo",
        "Hệ thống xác thực đang khởi động. Vui lòng thử lại sau giây lát.",
      );
      return;
    }

    setIsLoading(true);
    setHasOtpError(false);
    setOtpCode("");

    try {
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
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setOtpFlow("SIGN_IN");
          setOtpStep("OTP");
          setCountdown(60);
          hapticFeedback.success();
          codeSent = true;
          return;
        } else {
          // User exists but has password auth only
          Alert.alert(
            "Tài khoản đã có mật khẩu",
            "Email này đã được đăng ký tài khoản với mật khẩu. Vui lòng chuyển sang tab 'Tài khoản' để đăng nhập.",
            [
              {
                text: "Chuyển sang Đăng nhập",
                onPress: () => {
                  setAuthMethod("account");
                  setAccountMode("login");
                },
              },
            ],
          );
          return;
        }
      } catch {
        // User not found in signIn, proceed to signUp
      }

      // 2. Try Sign Up flow (for new user)
      if (!codeSent) {
        try {
          await signUp.create({
            emailAddress: emailToUse,
          });

          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });

          setOtpFlow("SIGN_UP");
          setOtpStep("OTP");
          setCountdown(60);
          hapticFeedback.success();
        } catch (signUpErr: unknown) {
          const isUserExists =
            (signUpErr as { errors?: { code: string }[] })?.errors?.[0]
              ?.code === "form_identifier_exists" ||
            (signUpErr instanceof Error &&
              signUpErr.message.toLowerCase().includes("already exists"));

          if (isUserExists) {
            Alert.alert(
              "Tài khoản đã tồn tại",
              "Email này đã có tài khoản trên Monevo. Vui lòng chuyển sang tab 'Tài khoản' để đăng nhập bằng mật khẩu.",
              [
                {
                  text: "Đăng nhập mật khẩu",
                  onPress: () => {
                    setAuthMethod("account");
                    setAccountMode("login");
                  },
                },
              ],
            );
            return;
          }
          throw signUpErr;
        }
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      const clerkError = (
        err as { errors?: { longMessage?: string; message?: string }[] }
      )?.errors?.[0];
      const msg =
        clerkError?.longMessage ||
        clerkError?.message ||
        (err instanceof Error
          ? err.message
          : "Không thể gửi mã. Vui lòng kiểm tra lại email.");
      Alert.alert("Lỗi gửi mã", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit OTP Code
  const handleVerifyOtpCode = async (customCode?: string) => {
    const raw = customCode || otpCode;
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
            let token: string | null = null;
            try {
              token = await getToken();
            } catch {}
            loginStore(
              {
                id: result.createdSessionId,
                email: email.trim().toLowerCase(),
                name: result.userData?.firstName || "Monevo User",
              },
              token || result.createdSessionId,
            );
            router.replace("/(tabs)");
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
          let token: string | null = null;
          try {
            token = await getToken();
          } catch {}
          loginStore(
            {
              id: result.createdUserId || result.createdSessionId,
              email: email.trim().toLowerCase(),
              name: result.firstName || "Monevo User",
            },
            token || result.createdSessionId,
          );
          router.replace("/(tabs)");
          return;
        }

        // If email is verified but missing fields requirement
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
                let token: string | null = null;
                try {
                  token = await getToken();
                } catch {}
                loginStore(
                  {
                    id: updateRes.createdUserId || updateRes.createdSessionId,
                    email: email.trim().toLowerCase(),
                    name: "Monevo User",
                  },
                  token || updateRes.createdSessionId,
                );
                router.replace("/(tabs)");
                return;
              }
            }
          } catch (updateErr) {
            console.warn("Error auto-filling missing Clerk fields:", updateErr);
          }

          setHasOtpError(true);
          hapticFeedback.error();
          Alert.alert(
            "Cần cấu hình Clerk",
            `Mã xác thực đã được Clerk chấp nhận, tuy nhiên dự án Clerk của bạn đang bật bắt buộc các trường: [${missing.join(", ")}].\n\nVui lòng vào dashboard.clerk.com -> "Email, Phone, Username" và chuyển các trường này sang Disabled (hoặc tắt bắt buộc), hoặc đăng nhập bằng mật khẩu qua tab "Tài khoản".`,
          );
          return;
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
            let token: string | null = null;
            try {
              token = await getToken();
            } catch {}
            loginStore(
              {
                id: result.createdSessionId,
                email: email.trim().toLowerCase(),
                name: result.userData?.firstName || "Monevo User",
              },
              token || result.createdSessionId,
            );
            router.replace("/(tabs)");
            return;
          }
        }
        throw signUpErr;
      }

      setHasOtpError(true);
      hapticFeedback.error();
      Alert.alert(
        "Mã không đúng",
        "Mã xác thực bạn vừa nhập không khớp hoặc đã hết hạn. Vui lòng kiểm tra lại email mới nhất.",
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
        (err instanceof Error ? err.message : "Mã xác thực không chính xác.");
      Alert.alert("Lỗi xác thực", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth 1-Tap Sign-In
  const handleGooglePress = async () => {
    hapticFeedback.light();
    setIsGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL("oauth-native-callback", {
        scheme: "monevo",
      });

      const {
        createdSessionId,
        setActive,
        signIn: oAuthSignIn,
        signUp: oAuthSignUp,
      } = await startGoogleOAuth({ redirectUrl });

      let targetSessionId =
        createdSessionId ||
        oAuthSignIn?.createdSessionId ||
        oAuthSignUp?.createdSessionId;

      if (
        !targetSessionId &&
        oAuthSignUp &&
        oAuthSignUp.status === "missing_requirements"
      ) {
        try {
          const dynamicUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const updateRes = await oAuthSignUp.update({
            username: dynamicUsername,
          });
          if (updateRes.status === "complete" && updateRes.createdSessionId) {
            targetSessionId = updateRes.createdSessionId;
          }
        } catch (err) {
          console.warn("Failed to update Google signup requirements:", err);
        }
      }

      if (targetSessionId && setActive) {
        await setActive({ session: targetSessionId });
        hapticFeedback.success();
        let token: string | null = null;
        try {
          token = await getToken();
        } catch {}
        loginStore(
          {
            id: targetSessionId,
            email:
              oAuthSignIn?.identifier ||
              oAuthSignUp?.emailAddress ||
              "google.user@clerk.dev",
            name: "Google User",
          },
          token || targetSessionId,
        );
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      const clerkError = (
        err as { errors?: { longMessage?: string; message?: string }[] }
      )?.errors?.[0];
      const msg =
        clerkError?.longMessage ||
        clerkError?.message ||
        (err instanceof Error
          ? err.message
          : "Không thể đăng nhập bằng Google.");
      Alert.alert("Đăng nhập Google", msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isAccountTab = authMethod === "account";
  const isRegister = accountMode === "register";

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
              {isAccountTab
                ? isRegister
                  ? "Tạo tài khoản mới để bắt đầu theo dõi chi tiêu"
                  : "Đăng nhập tài khoản để quản lý tài chính cá nhân"
                : otpStep === "EMAIL"
                  ? "Đăng nhập an toàn & tiện lợi bằng mã OTP email"
                  : "Nhập mã 6 chữ số được gửi tới hộp thư của bạn"}
            </Text>
          </View>

          {/* Card Form */}
          <View style={authStyles.card}>
            {/* Top Level Method Switcher: Account vs OTP */}
            <View style={authStyles.methodSwitcher}>
              <SegmentedControl
                options={[
                  {
                    value: "account",
                    label: "Tài khoản",
                    icon: (
                      <Ionicons
                        name="person-circle-outline"
                        size={17}
                        color={
                          isAccountTab ? colors.primary : colors.textSecondary
                        }
                      />
                    ),
                  },
                  {
                    value: "otp",
                    label: "Mã OTP",
                    icon: (
                      <Ionicons
                        name="mail-outline"
                        size={17}
                        color={
                          !isAccountTab ? colors.primary : colors.textSecondary
                        }
                      />
                    ),
                  },
                ]}
                value={authMethod}
                onChange={(val) => {
                  hapticFeedback.selection();
                  setAuthMethod(val);
                  setErrors({});
                  setHasOtpError(false);
                }}
              />
            </View>

            {/* ================= METHOD 1: ACCOUNT (EMAIL & PASSWORD) ================= */}
            {isAccountTab ? (
              <View>
                {/* Sub-mode Switcher: Sign In vs Register */}
                <View style={authStyles.modeSwitcher}>
                  <SegmentedControl
                    options={[
                      { value: "login", label: "Đăng nhập" },
                      { value: "register", label: "Đăng ký" },
                    ]}
                    value={accountMode}
                    onChange={(val) => {
                      hapticFeedback.selection();
                      setAccountMode(val);
                      setErrors({});
                    }}
                  />
                </View>

                {/* Form Fields */}
                <View style={authStyles.form}>
                  {isRegister && (
                    <Input
                      label="Họ và tên"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) {
                          setErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      error={errors.name}
                      autoCapitalize="words"
                      leftIcon={
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={colors.primary}
                        />
                      }
                    />
                  )}

                  <Input
                    label="Địa chỉ Email"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearable
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={colors.primary}
                      />
                    }
                  />

                  <Input
                    label="Mật khẩu"
                    placeholder={
                      isRegister ? "Tối thiểu 6 ký tự" : "Nhập mật khẩu của bạn"
                    }
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    error={errors.password}
                    isPassword
                    autoCapitalize="none"
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={colors.primary}
                      />
                    }
                  />

                  <Button
                    title={isRegister ? "Đăng ký tài khoản ➜" : "Đăng nhập ➜"}
                    onPress={() => void handleAccountSubmit()}
                    isLoading={isLoading}
                    size="lg"
                    style={authStyles.submitButton}
                  />
                </View>

                {/* Footer Switch Link */}
                <View style={authStyles.footerRow}>
                  <Text style={authStyles.footerText}>
                    {isRegister
                      ? "Đã có tài khoản Monevo?"
                      : "Chưa có tài khoản Monevo?"}
                  </Text>
                  <Pressable
                    onPress={() => {
                      hapticFeedback.light();
                      setAccountMode(isRegister ? "login" : "register");
                      setErrors({});
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={authStyles.footerLink}>
                      {isRegister ? "Đăng nhập ngay" : "Đăng ký ngay"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ================= METHOD 2: OTP (EMAIL CODE) ================= */
              <View>
                {otpStep === "EMAIL" ? (
                  /* OTP Step 1: Input Email */
                  <View>
                    <Input
                      label="Địa chỉ Email"
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setHasOtpError(false);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                      clearable
                      leftIcon={
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color={colors.primary}
                        />
                      }
                    />

                    <Button
                      title="Gửi mã đăng nhập ➜"
                      onPress={() => void handleSendOtpCode()}
                      isLoading={isLoading}
                      size="lg"
                      style={authStyles.submitButton}
                    />
                  </View>
                ) : (
                  /* OTP Step 2: Input 6-Digit Code */
                  <View>
                    <View style={authStyles.otpInfoBox}>
                      <Ionicons
                        name="mail-open"
                        size={22}
                        color={colors.primaryDark}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={authStyles.otpInfoText}>
                          Mã xác nhận đã gửi đến:
                        </Text>
                        <Text style={authStyles.otpEmailText} numberOfLines={1}>
                          {email}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          hapticFeedback.light();
                          setOtpStep("EMAIL");
                        }}
                        hitSlop={8}
                        style={authStyles.editEmailBtn}
                      >
                        <Ionicons
                          name="pencil"
                          size={13}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>

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

                    <Button
                      title="Xác nhận & Vào ứng dụng ✔"
                      onPress={() => void handleVerifyOtpCode()}
                      isLoading={isLoading}
                      size="lg"
                      style={authStyles.submitButton}
                    />

                    <View style={authStyles.resendRow}>
                      {countdown > 0 ? (
                        <Text style={authStyles.countdownText}>
                          Gửi lại mã sau ({countdown}s)
                        </Text>
                      ) : (
                        <Pressable
                          onPress={() => void handleSendOtpCode()}
                          disabled={isLoading}
                          hitSlop={8}
                          style={authStyles.resendBtn}
                        >
                          <Ionicons
                            name="refresh-outline"
                            size={15}
                            color={colors.primary}
                          />
                          <Text style={authStyles.resendText}>
                            Gửi lại mã OTP
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ================= SHARED GOOGLE AUTH BUTTON ================= */}
            <View style={authStyles.dividerRow}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>HOẶC</Text>
              <View style={authStyles.dividerLine} />
            </View>

            <View style={authStyles.googleButtonContainer}>
              <GoogleButton
                onPress={handleGooglePress}
                isLoading={isGoogleLoading}
                disabled={isLoading || isGoogleLoading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
