import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "@/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "elevated" | "outlined" | "flat" | "glass";
  onPress?: () => void;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  style,
  variant = "outlined",
  onPress,
  padding = "base",
}: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.surface,
          ...shadows.sm,
        };
      case "flat":
        return {
          backgroundColor: colors.surfaceSecondary,
        };
      case "glass":
        return {
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.5)",
        };
      case "outlined":
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  const containerStyle = [
    styles.card,
    { padding: spacing[padding] },
    getVariantStyle(),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
