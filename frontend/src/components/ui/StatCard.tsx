import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatCurrency } from "@/lib/format";

export interface StatCardProps {
  label: string;
  amount: number;
  type?: "income" | "expense" | "neutral";
  subtitle?: string;
  style?: ViewStyle;
}

export function StatCard({
  label,
  amount,
  type = "neutral",
  subtitle,
  style,
}: StatCardProps) {
  const getIconAndColor = () => {
    switch (type) {
      case "income":
        return {
          icon: "arrow-down-circle-outline" as const,
          color: colors.income,
          bgColor: colors.incomeBg,
          sign: "+",
        };
      case "expense":
        return {
          icon: "arrow-up-circle-outline" as const,
          color: colors.expense,
          bgColor: colors.expenseBg,
          sign: "−",
        };
      case "neutral":
      default:
        return {
          icon: "wallet-outline" as const,
          color: colors.primary,
          bgColor: colors.primaryMuted,
          sign: "",
        };
    }
  };

  const { icon, color, bgColor, sign } = getIconAndColor();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text
        style={[
          styles.amount,
          { color: type === "neutral" ? colors.text : color },
        ]}
      >
        {sign}
        {formatCurrency(amount)}
      </Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs + 2,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    ...typography.title3,
    fontWeight: "700",
    marginTop: 4,
    ...typography.tabular,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
