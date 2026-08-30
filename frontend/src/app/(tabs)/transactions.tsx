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
import { Transaction, useTransactionStore } from "@/store/transaction.store";
import { useWalletStore } from "@/store/wallet.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import {
  EmptyState,
  Header,
  Input,
  SegmentedControl,
  TransactionSkeletonList,
} from "@/components/ui";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, isLoading, fetchTransactions } = useTransactionStore();
  const { wallets, fetchWallets } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">(
    "ALL",
  );
  const [selectedWalletId, setSelectedWalletId] = useState<string>("ALL");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchWallets()]);
  }, [fetchTransactions, fetchWallets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== "ALL" && tx.type !== typeFilter) {
        return false;
      }

      // Wallet filter
      if (selectedWalletId !== "ALL" && tx.walletId !== selectedWalletId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const catName = categoryDisplayName(
          tx.category?.name || "",
        ).toLowerCase();
        const note = (tx.note || "").toLowerCase();
        const walletName = (tx.wallet?.name || "").toLowerCase();
        if (
          !catName.includes(query) &&
          !note.includes(query) &&
          !walletName.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, selectedWalletId, searchQuery]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { dateLabel: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    for (const tx of filteredTransactions) {
      const txDate = new Date(tx.date);
      const txDateStr = txDate.toDateString();

      let label = txDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (txDateStr === todayStr) {
        label = "Today";
      } else if (txDateStr === yesterdayStr) {
        label = "Yesterday";
      }

      if (!map.has(label)) {
        map.set(label, []);
        groups.push({ dateLabel: label, items: map.get(label)! });
      }
      map.get(label)!.push(tx);
    }

    return groups;
  }, [filteredTransactions]);

  // Summary stats for filtered
  const { totalIn, totalOut } = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === "INCOME") totalIn += tx.amount;
      else totalOut += tx.amount;
    }
    return { totalIn, totalOut };
  }, [filteredTransactions]);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Transaction History"
        subtitle={`${filteredTransactions.length} records found`}
        rightAction={
          <Pressable
            onPress={() => router.push("/add-transaction")}
            style={styles.addBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        }
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
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by category, note or account..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearable
            containerStyle={{ marginBottom: 0 }}
            leftIcon={
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
            }
          />
        </View>

        {/* Type Segment Control */}
        <View style={styles.filterSection}>
          <SegmentedControl
            options={[
              { value: "ALL", label: "All" },
              {
                value: "EXPENSE",
                label: "Expenses",
                activeColor: colors.expense,
                activeBgColor: colors.surface,
              },
              {
                value: "INCOME",
                label: "Income",
                activeColor: colors.income,
                activeBgColor: colors.surface,
              },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </View>

        {/* Wallet Filter Pills */}
        {wallets.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletFilterPills}
          >
            <Pressable
              onPress={() => setSelectedWalletId("ALL")}
              style={[
                styles.walletPill,
                selectedWalletId === "ALL" && styles.walletPillActive,
              ]}
            >
              <Text
                style={[
                  styles.walletPillText,
                  selectedWalletId === "ALL" && styles.walletPillTextActive,
                ]}
              >
                All Accounts
              </Text>
            </Pressable>

            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                style={[
                  styles.walletPill,
                  selectedWalletId === w.id && styles.walletPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.walletPillText,
                    selectedWalletId === w.id && styles.walletPillTextActive,
                  ]}
                >
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Summary Card for Selected Filters */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryVal, { color: colors.income }]}>
              +{formatCurrency(totalIn)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={[styles.summaryVal, { color: colors.expense }]}>
              −{formatCurrency(totalOut)}
            </Text>
          </View>
        </View>

        {/* Grouped Transactions List */}
        <View style={styles.listContainer}>
          {isLoading && transactions.length === 0 ? (
            <TransactionSkeletonList count={6} />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No Transactions Found"
              description="Try adjusting your search query or filters to find what you're looking for."
              actionTitle={
                searchQuery || typeFilter !== "ALL"
                  ? "Reset Filters"
                  : "Add Transaction"
              }
              onAction={() => {
                if (
                  searchQuery ||
                  typeFilter !== "ALL" ||
                  selectedWalletId !== "ALL"
                ) {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                  setSelectedWalletId("ALL");
                } else {
                  router.push("/add-transaction");
                }
              }}
            />
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.dateLabel} style={styles.groupSection}>
                <Text style={styles.groupHeader}>{group.dateLabel}</Text>
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onPress={() => setSelectedTx(tx)}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.xs,
  },
  filterSection: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
  },
  walletFilterPills: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  walletPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  walletPillText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  walletPillTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryVal: {
    ...typography.headline,
    fontWeight: "700",
    marginTop: 2,
    ...typography.tabular,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  listContainer: {
    paddingHorizontal: spacing.base,
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupHeader: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
});
