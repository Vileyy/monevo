import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export interface BadgeProps {
  label: string;
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "neutral";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = "neutral",
  size = "md",
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case "primary":
        return {
          bg: colors.primaryMuted,
          text: colors.primary,
          border: colors.primaryLight,
        };
      case "success":
        return {
          bg: colors.incomeBg,
          text: colors.income,
          border: colors.incomeBorder,
        };
      case "danger":
        return {
          bg: colors.expenseBg,
          text: colors.expense,
          border: colors.expenseBorder,
        };
      case "warning":
        return {
          bg: colors.warningBg,
          text: colors.warning,
          border: "#FDE68A",
        };
      case "info":
        return { bg: colors.infoBg, text: colors.info, border: "#BFDBFE" };
      case "neutral":
      default:
        return {
          bg: colors.surfaceSecondary,
          text: colors.textSecondary,
          border: colors.border,
        };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        size === "sm" ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          size === "sm" ? styles.textSm : styles.textMd,
          { color: text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
  textSm: {
    ...typography.caption,
    fontSize: 11,
  },
  textMd: {
    ...typography.footnote,
    fontSize: 12,
  },
});
