import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryContainer;
      case "outline":
        return styles.outlineContainer;
      case "danger":
        return styles.dangerContainer;
      case "ghost":
        return styles.ghostContainer;
      case "primary":
      default:
        return styles.primaryContainer;
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "danger":
        return styles.dangerText;
      case "ghost":
        return styles.ghostText;
      case "primary":
      default:
        return styles.primaryText;
    }
  };

  const getSizeContainerStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return styles.smContainer;
      case "lg":
        return styles.lgContainer;
      case "md":
      default:
        return styles.mdContainer;
    }
  };

  const getSizeTextStyle = (): TextStyle => {
    switch (size) {
      case "sm":
        return styles.smText;
      case "lg":
        return styles.lgText;
      case "md":
      default:
        return styles.mdText;
    }
  };

  const spinnerColor =
    variant === "primary" || variant === "danger"
      ? colors.textInverse
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.baseContainer,
        getVariantContainerStyle(),
        getSizeContainerStyle(),
        fullWidth && styles.fullWidth,
        (disabled || isLoading) && styles.disabledContainer,
        pressed && !disabled && !isLoading && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.baseText,
              getVariantTextStyle(),
              getSizeTextStyle(),
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  baseText: {
    fontWeight: "600",
    textAlign: "center",
  },

  // Sizes
  smContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  smText: {
    ...typography.subhead,
    fontWeight: "600",
  },
  mdContainer: {
    paddingVertical: 14,
    paddingHorizontal: spacing.base,
    minHeight: 48,
  },
  mdText: {
    ...typography.headline,
  },
  lgContainer: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  lgText: {
    fontSize: 17,
    fontWeight: "700",
  },

  // Variants
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryContainer: {
    backgroundColor: colors.surfaceSecondary,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.text,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.textInverse,
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: colors.primary,
  },

  // Disabled
  disabledContainer: {
    opacity: 0.55,
  },
  disabledText: {
    opacity: 0.8,
  },
});
