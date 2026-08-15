import React, { useEffect, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { styles } from "@/features/insights/styles/explore.styles";
import { useTransactionStore } from "@/store/transaction.store";
import { formatCurrency, categoryDisplayName } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function ExploreScreen() {
  const { transactions, isLoading, fetchTransactions } = useTransactionStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const { income, expense, breakdown } = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const byCategory: Record<string, { name: string; amount: number }> = {};

    for (const tx of transactions) {
      if (tx.type === "INCOME") {
        incomeTotal += tx.amount;
      } else {
        expenseTotal += tx.amount;
        const key = tx.categoryId || "other";
        const name = categoryDisplayName(tx.category?.name || "Other");
        byCategory[key] = byCategory[key] || { name, amount: 0 };
        byCategory[key].amount += tx.amount;
      }
    }

    const rows = Object.values(byCategory).sort((a, b) => b.amount - a.amount);
    return { income: incomeTotal, expense: expenseTotal, breakdown: rows };
  }, [transactions]);

  const maxExpense = breakdown[0]?.amount || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>
        <Text style={styles.headerSubtitle}>
          Income and spending from your real data
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(income)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {formatCurrency(expense)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Spending by category</Text>
            {breakdown.length === 0 ? (
              <View style={styles.emptyHint}>
                <Text style={styles.emptyHintText}>
                  No expenses yet. Add an expense transaction to see the
                  category breakdown.
                </Text>
              </View>
            ) : (
              breakdown.map((item) => (
                <View key={item.name} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryValue}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${maxExpense ? (item.amount / maxExpense) * 100 : 0}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
