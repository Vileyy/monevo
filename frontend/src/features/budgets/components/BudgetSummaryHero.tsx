import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { BudgetSummary } from "@/store/budget.store";
import { formatCurrency } from "@/lib/format";
import { useSettingsStore } from "@/store/settings.store";
import { BudgetProgressBar } from "./BudgetProgressBar";

export interface BudgetSummaryHeroProps {
  summary: BudgetSummary;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddBudget: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function BudgetSummaryHero({
  summary,
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onAddBudget,
}: BudgetSummaryHeroProps) {
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <View style={styles.container}>
      {/* Month Selector Bar */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={onPrevMonth}
          style={styles.monthArrowBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <Text style={styles.monthTitle}>{monthLabel}</Text>

        <Pressable
          onPress={onNextMonth}
          style={styles.monthArrowBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Hero Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardSubtitle}>Monthly Budget</Text>
            <Text style={styles.cardTotal}>
              {hideBalance ? "••••••••" : formatCurrency(summary.totalBudget)}
            </Text>
          </View>

          <Pressable
            onPress={onAddBudget}
            style={styles.addButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Set budget limit"
          >
            <Ionicons name="add" size={18} color={colors.surface} />
            <Text style={styles.addButtonText}>Set Budget</Text>
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <BudgetProgressBar
            percentage={summary.overallPercentage}
            height={10}
          />
          <View style={styles.progressLabelRow}>
            <Text style={styles.percentageText}>
              {summary.overallPercentage}% of total budget used
            </Text>
          </View>
        </View>

        {/* 2-Column Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <View
              style={[styles.statDot, { backgroundColor: colors.danger }]}
            />
            <View>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>
                {hideBalance ? "••••" : formatCurrency(summary.totalSpent)}
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View
              style={[styles.statDot, { backgroundColor: colors.accent }]}
            />
            <View>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text
                style={[
                  styles.statValue,
                  summary.totalRemaining < 0 && { color: colors.danger },
                ]}
              >
                {hideBalance
                  ? "••••"
                  : formatCurrency(Math.max(summary.totalRemaining, 0))}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  monthArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  monthTitle: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSubtitle: {
    ...typography.subhead,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTotal: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
    ...typography.tabular,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
    gap: 4,
  },
  addButtonText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.surface,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
  },
  percentageText: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  statCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.6)",
  },
  statValue: {
    ...typography.caption,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 1,
    ...typography.tabular,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: spacing.sm,
  },
});
