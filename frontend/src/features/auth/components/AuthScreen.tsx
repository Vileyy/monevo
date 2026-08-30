import React, { useState } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/services/api/client";
import { Button, Input, SegmentedControl } from "@/components/ui";
import { authStyles } from "@/features/auth/styles/auth.styles";
import { colors } from "@/theme";
import { apiErrorMessage } from "@/lib/api-error";
import { GoogleButton } from "./GoogleButton";

WebBrowser.maybeCompleteAuthSession();

export interface AuthScreenProps {
  initialMode?: "login" | "register";
}

export function AuthScreen({ initialMode = "login" }: AuthScreenProps) {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.OS === "ios" ? iosClientId : webClientId,
    webClientId,
    iosClientId,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "monevo",
      preferLocalhost: true,
    }),
  });

  const handleGoogleToken = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      const res = await apiClient.post("/auth/google", { idToken });
      const { user, accessToken } = res.data;

      if (!accessToken) {
        Alert.alert("Error", "No authentication token received from server.");
        return;
      }

      loginStore(user, accessToken);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      Alert.alert(
        "Google Sign-In Failed",
        apiErrorMessage(
          error,
          "Could not sign in with Google. Please try again.",
        ),
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!request) {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is initializing. Please try again in a moment.",
      );
      return;
    }
    try {
      const res = await promptAsync();
      if (res?.type === "success") {
        const idToken = res.params?.id_token || res.authentication?.idToken;
        if (idToken) {
          await handleGoogleToken(idToken);
        }
      }
    } catch {
      Alert.alert("Google Sign-In", "Unable to launch Google authentication.");
    }
  };

  const validate = () => {
    const nextErrors: { name?: string; email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === "register" && !trimmedName) {
      nextErrors.name = "Full name is required";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: email.trim(), password }
          : { email: email.trim(), password, name: name.trim() };

      const response = await apiClient.post(endpoint, payload);
      const { user, accessToken } = response.data;

      if (!accessToken) {
        Alert.alert("Error", "No authentication token received.");
        return;
      }

      loginStore(user, accessToken);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const title = mode === "login" ? "Sign In Failed" : "Registration Failed";
      const fallback =
        mode === "login"
          ? "Invalid email or password. Please try again."
          : "Unable to create account. Please try again.";
      Alert.alert(title, apiErrorMessage(error, fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <Ionicons name="wallet" size={32} color="#FFFFFF" />
            </View>
            <Text style={authStyles.appName}>MONEVO</Text>
            <Text style={authStyles.appTagline}>
              Smart & effortless personal wealth tracking
            </Text>
          </View>

          {/* Form Card */}
          <View style={authStyles.card}>
            {/* Segmented Switcher */}
            <View style={authStyles.authTabSwitcher}>
              <SegmentedControl
                options={[
                  { value: "login", label: "Sign In" },
                  { value: "register", label: "Create Account" },
                ]}
                value={mode}
                onChange={(val) => {
                  setMode(val);
                  setErrors({});
                }}
              />
            </View>

            <View style={authStyles.cardHeader}>
              <Text style={authStyles.title}>
                {isRegister ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={authStyles.subtitle}>
                {isRegister
                  ? "Start tracking and organizing your daily wealth"
                  : "Sign in to manage and track your money"}
              </Text>
            </View>

            {/* Email / Password Form */}
            <View style={authStyles.form}>
              {isRegister && (
                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  error={errors.name}
                  autoCapitalize="words"
                  leftIcon={
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.primary}
                    />
                  }
                />
              )}

              <Input
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                clearable
                leftIcon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.primary}
                  />
                }
              />

              <Input
                label="Password"
                placeholder={
                  isRegister ? "Minimum 6 characters" : "Enter your password"
                }
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                isPassword
                autoCapitalize="none"
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.primary}
                  />
                }
              />

              <Button
                title={isRegister ? "Create Account" : "Sign In"}
                onPress={handleSubmit}
                isLoading={isLoading}
                size="lg"
                style={authStyles.submitButton}
                rightIcon={
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                }
              />
            </View>

            {/* Divider */}
            <View style={authStyles.dividerRow}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>or continue with</Text>
              <View style={authStyles.dividerLine} />
            </View>

            {/* Google Login Button placed below */}
            <View style={authStyles.googleButtonContainer}>
              <GoogleButton
                onPress={handleGooglePress}
                isLoading={isGoogleLoading}
                disabled={isLoading || isGoogleLoading}
              />
            </View>

            {/* Footer Quick Switch Link */}
            <View style={authStyles.footerRow}>
              <Text style={authStyles.footerText}>
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </Text>
              <Pressable
                onPress={() => {
                  setMode(isRegister ? "login" : "register");
                  setErrors({});
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={authStyles.footerLink}>
                  {isRegister ? "Sign in" : "Sign up"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
