import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { Transaction } from "@/store/transaction.store";

export interface CashflowBarChartProps {
  transactions: Transaction[];
  startDate: Date;
  endDate: Date;
  hideBalance?: boolean;
}

export function CashflowBarChart({ transactions }: CashflowBarChartProps) {
  if (transactions.length === 0) {
    return null;
  }

  const dayBuckets: Record<
    string,
    { income: number; expense: number; label: string }
  > = {};

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    dayBuckets[key] = dayBuckets[key] || {
      income: 0,
      expense: 0,
      label: key,
    };
    if (tx.type === "INCOME") {
      dayBuckets[key].income += tx.amount;
    } else {
      dayBuckets[key].expense += tx.amount;
    }
  }

  const keys = Object.keys(dayBuckets).slice(-8); // Show latest 8 active days

  if (keys.length === 0) {
    return null;
  }

  const rawBarData = keys.flatMap((key) => {
    const item = dayBuckets[key];
    return [
      {
        value: item.income,
        label: item.label,
        frontColor: colors.income,
        spacing: 4,
        labelTextStyle: { color: colors.textMuted, fontSize: 10 },
      },
      {
        value: item.expense,
        frontColor: colors.expense,
      },
    ];
  });

  const maxValue = Math.max(...rawBarData.map((d) => d.value), 100000);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Daily Cashflow Activity</Text>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.income }]}
            />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.expense }]}
            />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <BarChart
          data={rawBarData}
          barWidth={12}
          spacing={16}
          roundedTop
          roundedBottom
          isAnimated
          animationDuration={600}
          noOfSections={3}
          maxValue={maxValue * 1.15}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          rulesColor={colors.borderLight}
          rulesType="solid"
          hideYAxisText
          width={280}
          height={150}
        />
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
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.headline,
    color: colors.text,
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
  },
});
