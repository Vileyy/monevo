import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactionStore } from "@/store/transaction.store";
import { BudgetItem, useBudgetStore } from "@/store/budget.store";
import { useSettingsStore } from "@/store/settings.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import {
  CategoryIcon,
  EmptyState,
  Header,
  SegmentedControl,
  StatCard,
} from "@/components/ui";
import { BudgetSummaryHero } from "@/features/budgets/components/BudgetSummaryHero";
import { BudgetCard } from "@/features/budgets/components/BudgetCard";
import { BudgetModal } from "@/features/budgets/components/BudgetModal";
import { CategoryPieChart } from "@/features/insights/components/CategoryPieChart";
import { CashflowBarChart } from "@/features/insights/components/CashflowBarChart";
import {
  DateRange,
  DateRangePickerModal,
} from "@/features/insights/components/DateRangePickerModal";

export default function ExploreScreen() {
  const router = useRouter();
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const { transactions, fetchTransactions } = useTransactionStore();
  const {
    budgets,
    summary: budgetSummary,
    selectedMonth: budgetMonth,
    selectedYear: budgetYear,
    fetchBudgets,
    deleteBudget,
    setSelectedDate,
  } = useBudgetStore();

  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "BUDGETS">(
    "ANALYTICS",
  );
  const [refreshing, setRefreshing] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      endDate: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    };
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetItem | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTransactions(),
      fetchBudgets(budgetMonth, budgetYear),
    ]);
  }, [fetchTransactions, fetchBudgets, budgetMonth, budgetYear]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    let nextMonth = budgetMonth - 1;
    let nextYear = budgetYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setSelectedDate(nextMonth, nextYear);
  };

  const handleNextMonth = () => {
    let nextMonth = budgetMonth + 1;
    let nextYear = budgetYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setSelectedDate(nextMonth, nextYear);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const startMs = customRange.startDate.getTime();
    const endMs = customRange.endDate.getTime();
    return transactions.filter((tx) => {
      const d = new Date(tx.date).getTime();
      return d >= startMs && d <= endMs;
    });
  }, [transactions, customRange]);

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

  const formatDateShort = (d: Date) => {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Insights & Budgets"
        subtitle="Cashflow analytics and spending limits"
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
        {/* Top Feature Switcher: Analytics vs Budgets */}
        <View style={styles.segmentContainer}>
          <SegmentedControl
            options={[
              { value: "ANALYTICS", label: "Analytics" },
              { value: "BUDGETS", label: "Budgets" },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {activeTab === "BUDGETS" ? (
          /* ================= BUDGETS TAB ================= */
          <View>
            <BudgetSummaryHero
              summary={budgetSummary}
              month={budgetMonth}
              year={budgetYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onAddBudget={() => {
                setBudgetToEdit(null);
                setShowBudgetModal(true);
              }}
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category Budgets</Text>

              {budgets.length === 0 ? (
                <EmptyState
                  icon="pie-chart-outline"
                  title="No Budgets Set"
                  description="Set monthly spending limits for your categories to keep your expenses on track."
                  actionTitle="Set Category Budget"
                  onAction={() => {
                    setBudgetToEdit(null);
                    setShowBudgetModal(true);
                  }}
                />
              ) : (
                budgets.map((item) => (
                  <BudgetCard
                    key={item.id}
                    budget={item}
                    onEdit={() => {
                      setBudgetToEdit(item);
                      setShowBudgetModal(true);
                    }}
                    onDelete={() => void deleteBudget(item.id)}
                  />
                ))
              )}
            </View>
          </View>
        ) : (
          /* ================= ANALYTICS TAB ================= */
          <View>
            {/* Date Range Selector Button */}
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [
                styles.dateRangeBadge,
                pressed && styles.dateRangeBadgePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Change date range"
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.dateRangeText}>
                {formatDateShort(customRange.startDate)} –{" "}
                {formatDateShort(customRange.endDate)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.textSecondary}
                style={{ marginLeft: 6 }}
              />
            </Pressable>

            {/* Income & Expense Stat Cards */}
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

            {/* Net Cashflow Summary Card */}
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
                      analytics.netSavings >= 0
                        ? colors.income
                        : colors.expense,
                  },
                ]}
              >
                {analytics.netSavings >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(analytics.netSavings))}
              </Text>
            </View>

            {/* Animated Daily Cashflow Bar Chart */}
            <CashflowBarChart
              transactions={filteredTransactions}
              startDate={customRange.startDate}
              endDate={customRange.endDate}
              hideBalance={hideBalance}
            />

            {/* Animated Donut Chart for Category Spending */}
            {analytics.expenseBreakdown.length > 0 ? (
              <CategoryPieChart
                items={analytics.expenseBreakdown}
                totalAmount={analytics.totalExpense}
                hideBalance={hideBalance}
              />
            ) : (
              <EmptyState
                icon="pie-chart-outline"
                title="No Expense Records"
                description="Add your daily expenses to see a categorized breakdown of where your money goes."
                actionTitle="Add Expense"
                onAction={() => router.push("/add-transaction")}
              />
            )}

            {/* Income Sources List */}
            {analytics.incomeBreakdown.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Income Sources</Text>
                {analytics.incomeBreakdown.map((item) => {
                  const percent =
                    analytics.totalIncome > 0
                      ? Math.round((item.amount / analytics.totalIncome) * 100)
                      : 0;

                  return (
                    <View key={item.name} style={styles.breakdownCard}>
                      <View style={styles.breakdownHeader}>
                        <View style={styles.catInfoRow}>
                          <CategoryIcon
                            name={item.name}
                            type="INCOME"
                            size="sm"
                          />
                          <View style={{ marginLeft: spacing.sm }}>
                            <Text style={styles.catName}>{item.name}</Text>
                            <Text style={styles.catTxCount}>
                              {item.count}{" "}
                              {item.count === 1 ? "record" : "records"}
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
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialRange={customRange}
        onApplyRange={(range) => {
          setCustomRange(range);
        }}
      />

      {/* Budget Modal */}
      <BudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        budgetToEdit={budgetToEdit}
        month={budgetMonth}
        year={budgetYear}
      />
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
    paddingBottom: spacing.xl,
  },
  segmentContainer: {
    marginBottom: spacing.sm,
  },
  dateRangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.xl,
    alignSelf: "center",
    width: "100%",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  dateRangeBadgePressed: {
    backgroundColor: colors.surfaceSecondary,
    transform: [{ scale: 0.99 }],
  },
  dateRangeText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.text,
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
    marginTop: spacing.sm,
    ...typography.tabular,
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
});
