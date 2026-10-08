import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { BudgetWarningDetails } from "@/lib/budget-warning";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { BudgetProgressBar } from "./BudgetProgressBar";

export interface BudgetWarningBannerProps {
  warning: BudgetWarningDetails;
  categoryName?: string;
}

export const BudgetWarningBanner = memo(function BudgetWarningBanner({
  warning,
  categoryName,
}: BudgetWarningBannerProps) {
  if (warning.status === "NONE") {
    return null;
  }

  const isExceeded = warning.status === "EXCEEDED";
  const isWarning = warning.status === "WARNING";

  const displayName = categoryName
    ? categoryDisplayName(categoryName)
    : "Budget";

  const containerStyle = [
    styles.container,
    isExceeded && styles.containerExceeded,
    isWarning && styles.containerWarning,
  ];

  const iconName = isExceeded
    ? "alert-circle"
    : isWarning
      ? "warning-outline"
      : "pie-chart-outline";

  const iconColor = isExceeded
    ? colors.danger
    : isWarning
      ? colors.warning
      : colors.accent;

  const headerTitle = isExceeded
    ? "Budget Exceeded"
    : isWarning
      ? "Approaching Budget Limit"
      : `Budget: ${displayName}`;

  const headerTitleStyle = [
    styles.headerTitle,
    isExceeded && styles.headerTitleExceeded,
    isWarning && styles.headerTitleWarning,
  ];

  const tagLabel = isExceeded
    ? "Over Limit"
    : isWarning
      ? "Near Limit"
      : `${Math.round(warning.projectedPercentage)}%`;

  const tagStyle = [
    styles.tag,
    isExceeded && styles.tagExceeded,
    isWarning && styles.tagWarning,
  ];

  const tagTextStyle = [
    styles.tagText,
    isExceeded && styles.tagTextExceeded,
    isWarning && styles.tagTextWarning,
  ];

  return (
    <View
      style={containerStyle}
      accessibilityRole="alert"
      accessibilityLabel={`${headerTitle}. ${warning.message}`}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name={iconName} size={18} color={iconColor} />
          <Text style={headerTitleStyle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        <View style={tagStyle}>
          <Text style={tagTextStyle}>{tagLabel}</Text>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.messageText}>{warning.message}</Text>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <BudgetProgressBar
          percentage={warning.projectedPercentage}
          height={6}
        />
      </View>

      {/* Footer Meta */}
      <View style={styles.footerRow}>
        <Text style={styles.metaText}>
          Spent after:{" "}
          <Text
            style={[styles.metaValue, isExceeded && styles.metaValueExceeded]}
          >
            {formatCurrency(warning.projectedSpent)}
          </Text>
        </Text>
        <Text style={styles.metaText}>
          Limit:{" "}
          <Text style={styles.metaValue}>
            {formatCurrency(warning.budgetAmount)}
          </Text>
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  containerExceeded: {
    backgroundColor: colors.expenseBg,
    borderColor: colors.expenseBorder,
  },
  containerWarning: {
    backgroundColor: colors.warningBg,
    borderColor: "#FDE68A",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.text,
  },
  headerTitleExceeded: {
    color: colors.danger,
  },
  headerTitleWarning: {
    color: "#B45309",
  },
  tag: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  tagExceeded: {
    backgroundColor: "#FFE4E6",
  },
  tagWarning: {
    backgroundColor: "#FEF3C7",
  },
  tagText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
    fontSize: 11,
  },
  tagTextExceeded: {
    color: colors.danger,
  },
  tagTextWarning: {
    color: "#B45309",
  },
  messageText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs + 2,
  },
  progressContainer: {
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  metaValue: {
    fontWeight: "600",
    color: colors.text,
  },
  metaValueExceeded: {
    color: colors.danger,
  },
});
