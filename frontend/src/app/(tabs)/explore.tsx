import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/store/transaction.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { getCategoryMeta } from "@/lib/categories";
import {
  CategoryIcon,
  EmptyState,
  Header,
  SegmentedControl,
  StatCard,
} from "@/components/ui";

export default function ExploreScreen() {
  const router = useRouter();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"MONTH" | "YEAR" | "ALL">("MONTH");

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Filter transactions by timeRange
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      if (timeRange === "MONTH") {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      if (timeRange === "YEAR") {
        return d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [transactions, timeRange]);

  // Compute analytics
  const analytics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    const expenseCategoryMap: Record<
      string,
      { name: string; amount: number; count: number }
    > = {};

    const incomeCategoryMap: Record<
      string,
      { name: string; amount: number; count: number }
    > = {};

    for (const tx of filteredTransactions) {
      const catName = categoryDisplayName(tx.category?.name || "Other");
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
        incomeCategoryMap[catName] = incomeCategoryMap[catName] || {
          name: catName,
          amount: 0,
          count: 0,
        };
        incomeCategoryMap[catName].amount += tx.amount;
        incomeCategoryMap[catName].count += 1;
      } else {
        totalExpense += tx.amount;
        expenseCategoryMap[catName] = expenseCategoryMap[catName] || {
          name: catName,
          amount: 0,
          count: 0,
        };
        expenseCategoryMap[catName].amount += tx.amount;
        expenseCategoryMap[catName].count += 1;
      }
    }

    const expenseBreakdown = Object.values(expenseCategoryMap).sort(
      (a, b) => b.amount - a.amount,
    );

    const incomeBreakdown = Object.values(incomeCategoryMap).sort(
      (a, b) => b.amount - a.amount,
    );

    const netSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round((netSavings / totalIncome) * 100))
        : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      expenseBreakdown,
      incomeBreakdown,
      topExpense: expenseBreakdown[0] || null,
    };
  }, [filteredTransactions]);

  const maxExpenseAmount = analytics.expenseBreakdown[0]?.amount || 1;
  const maxIncomeAmount = analytics.incomeBreakdown[0]?.amount || 1;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Financial Insights"
        subtitle="Cashflow analytics and spending trends"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Time Range Filter */}
        <View style={styles.segmentContainer}>
          <SegmentedControl
            options={[
              { value: "MONTH", label: "This Month" },
              { value: "YEAR", label: "This Year" },
              { value: "ALL", label: "All Time" },
            ]}
            value={timeRange}
            onChange={setTimeRange}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Income"
            amount={analytics.totalIncome}
            type="income"
          />
          <StatCard
            label="Expenses"
            amount={analytics.totalExpense}
            type="expense"
          />
        </View>

        {/* Net Cashflow Card */}
        <View style={styles.cashflowCard}>
          <View style={styles.cashflowHeader}>
            <View>
              <Text style={styles.cashflowTitle}>Net Cash Flow</Text>
              <Text style={styles.cashflowSubtitle}>
                {analytics.netSavings >= 0 ? "Surplus Saved" : "Deficit"}
              </Text>
            </View>

            <View
              style={[
                styles.savingsBadge,
                {
                  backgroundColor:
                    analytics.netSavings >= 0
                      ? colors.incomeBg
                      : colors.expenseBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.savingsBadgeText,
                  {
                    color:
                      analytics.netSavings >= 0
                        ? colors.income
                        : colors.expense,
                  },
                ]}
              >
                {analytics.savingsRate}% Saved
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.netAmount,
              {
                color:
                  analytics.netSavings >= 0 ? colors.income : colors.expense,
              },
            ]}
          >
            {analytics.netSavings >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(analytics.netSavings))}
          </Text>

          {/* Ratio bar */}
          <View style={styles.ratioBarContainer}>
            <View
              style={[
                styles.ratioIncome,
                {
                  flex: analytics.totalIncome > 0 ? analytics.totalIncome : 1,
                },
              ]}
            />
            <View
              style={[
                styles.ratioExpense,
                {
                  flex:
                    analytics.totalExpense > 0 ? analytics.totalExpense : 0.001,
                },
              ]}
            />
          </View>
        </View>

        {/* Spending by Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>

          {analytics.expenseBreakdown.length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title="No Expense Records"
              description="Add your daily expenses to see a categorized breakdown of where your money goes."
              actionTitle="Add Expense"
              onAction={() => router.push("/add-transaction")}
            />
          ) : (
            analytics.expenseBreakdown.map((item) => {
              const meta = getCategoryMeta(item.name, "EXPENSE");
              const percent =
                analytics.totalExpense > 0
                  ? Math.round((item.amount / analytics.totalExpense) * 100)
                  : 0;
              const barWidthPercent =
                maxExpenseAmount > 0
                  ? Math.round((item.amount / maxExpenseAmount) * 100)
                  : 0;

              return (
                <View key={item.name} style={styles.breakdownCard}>
                  <View style={styles.breakdownHeader}>
                    <View style={styles.catInfoRow}>
                      <CategoryIcon name={item.name} type="EXPENSE" size="sm" />
                      <View style={{ marginLeft: spacing.sm }}>
                        <Text style={styles.catName}>{item.name}</Text>
                        <Text style={styles.catTxCount}>
                          {item.count}{" "}
                          {item.count === 1 ? "transaction" : "transactions"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.catAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                      <Text style={styles.catPercent}>{percent}% of total</Text>
                    </View>
                  </View>

                  {/* Visual Bar */}
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barWidthPercent}%`,
                          backgroundColor: meta.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Income Sources Section */}
        {analytics.incomeBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Sources</Text>
            {analytics.incomeBreakdown.map((item) => {
              const percent =
                analytics.totalIncome > 0
                  ? Math.round((item.amount / analytics.totalIncome) * 100)
                  : 0;
              const barWidthPercent =
                maxIncomeAmount > 0
                  ? Math.round((item.amount / maxIncomeAmount) * 100)
                  : 0;

              return (
                <View key={item.name} style={styles.breakdownCard}>
                  <View style={styles.breakdownHeader}>
                    <View style={styles.catInfoRow}>
                      <CategoryIcon name={item.name} type="INCOME" size="sm" />
                      <View style={{ marginLeft: spacing.sm }}>
                        <Text style={styles.catName}>{item.name}</Text>
                        <Text style={styles.catTxCount}>
                          {item.count} {item.count === 1 ? "record" : "records"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={[styles.catAmount, { color: colors.income }]}
                      >
                        +{formatCurrency(item.amount)}
                      </Text>
                      <Text style={styles.catPercent}>
                        {percent}% of income
                      </Text>
                    </View>
                  </View>

                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barWidthPercent}%`,
                          backgroundColor: colors.income,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.huge,
  },
  segmentContainer: {
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cashflowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  cashflowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cashflowTitle: {
    ...typography.headline,
    color: colors.text,
  },
  cashflowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  savingsBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  savingsBadgeText: {
    ...typography.caption,
    fontWeight: "700",
  },
  netAmount: {
    fontSize: 28,
    fontWeight: "800",
    marginVertical: spacing.sm,
    ...typography.tabular,
  },
  ratioBarContainer: {
    height: 8,
    flexDirection: "row",
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
  },
  ratioIncome: {
    backgroundColor: colors.income,
    height: "100%",
  },
  ratioExpense: {
    backgroundColor: colors.expense,
    height: "100%",
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
    ...shadows.sm,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  catInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  catName: {
    ...typography.headline,
    color: colors.text,
  },
  catTxCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  catAmount: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
    ...typography.tabular,
  },
  catPercent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barBackground: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },
});
