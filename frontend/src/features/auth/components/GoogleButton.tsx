import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";

export interface GoogleButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GoogleButton({
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: GoogleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && !isLoading && styles.pressed,
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          </View>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  pressed: {
    backgroundColor: colors.surfaceSecondary,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    ...typography.headline,
    color: colors.text,
    fontWeight: "600",
  },
});
