import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { getCategoryMeta } from "@/lib/categories";
import { CategoryIcon } from "@/components/ui";

export interface CategoryBreakdownItem {
  name: string;
  amount: number;
  count: number;
}

export interface CategoryPieChartProps {
  items: CategoryBreakdownItem[];
  totalAmount: number;
  hideBalance?: boolean;
}

const PALETTE = [
  "#0D9488",
  "#F59E0B",
  "#EC4899",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
  "#F97316",
];

export function CategoryPieChart({
  items,
  totalAmount,
  hideBalance = false,
}: CategoryPieChartProps) {
  if (items.length === 0 || totalAmount <= 0) {
    return null;
  }

  const chartData = items.slice(0, 6).map((item, index) => {
    const meta = getCategoryMeta(item.name, "EXPENSE");
    const color = meta.color || PALETTE[index % PALETTE.length];
    const percent = Math.round((item.amount / totalAmount) * 100);

    return {
      value: item.amount,
      color,
      text: `${percent}%`,
      textColor: colors.surface,
      textSize: 11,
      name: item.name,
      count: item.count,
    };
  });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Spending Distribution</Text>

      {/* Donut Chart Container */}
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData}
          donut
          isAnimated
          animationDuration={700}
          radius={88}
          innerRadius={58}
          innerCircleColor={colors.surface}
          centerLabelComponent={() => {
            return (
              <View style={styles.centerLabel}>
                <Text style={styles.centerSub}>Total</Text>
                <Text style={styles.centerAmount} numberOfLines={1}>
                  {hideBalance ? "••••" : formatCurrency(totalAmount)}
                </Text>
              </View>
            );
          }}
        />
      </View>

      {/* Legend / Breakdown List */}
      <View style={styles.legendContainer}>
        {items.map((item, index) => {
          const meta = getCategoryMeta(item.name, "EXPENSE");
          const color = meta.color || PALETTE[index % PALETTE.length];
          const percent =
            totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
          const displayName = categoryDisplayName(item.name);

          return (
            <View key={item.name} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View
                  style={[styles.colorIndicator, { backgroundColor: color }]}
                />
                <CategoryIcon name={item.name} type="EXPENSE" size="sm" />
                <View style={styles.legendTextCol}>
                  <Text style={styles.legendName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.legendTxCount}>
                    {item.count} {item.count === 1 ? "tx" : "txs"}
                  </Text>
                </View>
              </View>

              <View style={styles.legendRight}>
                <Text style={styles.legendAmount}>
                  {hideBalance ? "••••" : formatCurrency(item.amount)}
                </Text>
                <Text style={styles.legendPercent}>{percent}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.headline,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 100,
  },
  centerSub: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "600",
  },
  centerAmount: {
    ...typography.caption,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
    fontSize: 11,
    ...typography.tabular,
  },
  legendContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: radius.full,
    marginRight: 2,
  },
  legendTextCol: {
    flex: 1,
  },
  legendName: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: "600",
  },
  legendTxCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  legendRight: {
    alignItems: "flex-end",
  },
  legendAmount: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.text,
    ...typography.tabular,
  },
  legendPercent: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
    fontSize: 11,
  },
});
