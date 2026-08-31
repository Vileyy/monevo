import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
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
import { hapticFeedback } from "@/lib/haptics";
import {
  EmptyState,
  Header,
  Input,
  SegmentedControl,
  TransactionSkeletonList,
} from "@/components/ui";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";

type SortOption = "DATE_DESC" | "AMOUNT_DESC" | "AMOUNT_ASC";

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
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");
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

  // 1. Filter logic
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

  // 2. Sort logic
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    if (sortBy === "AMOUNT_DESC") {
      return list.sort((a, b) => b.amount - a.amount);
    }
    if (sortBy === "AMOUNT_ASC") {
      return list.sort((a, b) => a.amount - b.amount);
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [filteredTransactions, sortBy]);

  // 3. Sections for SectionList
  const sections = useMemo(() => {
    if (sortedTransactions.length === 0) return [];

    if (sortBy !== "DATE_DESC") {
      const label =
        sortBy === "AMOUNT_DESC"
          ? "Sorted: Highest → Lowest"
          : "Sorted: Lowest → Highest";
      return [{ title: label, data: sortedTransactions }];
    }

    const result: { title: string; data: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    for (const tx of sortedTransactions) {
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
        result.push({ title: label, data: map.get(label)! });
      }
      map.get(label)!.push(tx);
    }

    return result;
  }, [sortedTransactions, sortBy]);

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

  const handleTypeChange = (val: "ALL" | "EXPENSE" | "INCOME") => {
    hapticFeedback.selection();
    setTypeFilter(val);
  };

  const handleWalletSelect = (walletId: string) => {
    hapticFeedback.selection();
    setSelectedWalletId(walletId);
  };

  const handleSortSelect = (sort: SortOption) => {
    hapticFeedback.selection();
    setSortBy(sort);
  };

  const renderHeader = useMemo(
    () => (
      <View>
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
            onChange={handleTypeChange}
          />
        </View>

        {/* Compact Filters & Sort Row */}
        <View style={styles.filterRowSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {/* Account Pills */}
            <Pressable
              onPress={() => handleWalletSelect("ALL")}
              style={[
                styles.pill,
                selectedWalletId === "ALL" && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedWalletId === "ALL" && styles.pillTextActive,
                ]}
              >
                All Accounts
              </Text>
            </Pressable>

            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => handleWalletSelect(w.id)}
                style={[
                  styles.pill,
                  selectedWalletId === w.id && styles.pillActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedWalletId === w.id && styles.pillTextActive,
                  ]}
                >
                  {w.name}
                </Text>
              </Pressable>
            ))}

            <View style={styles.pillDivider} />

            {/* Sort Pills */}
            <Pressable
              onPress={() => handleSortSelect("DATE_DESC")}
              style={[
                styles.pill,
                sortBy === "DATE_DESC" && styles.sortPillActive,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={
                  sortBy === "DATE_DESC" ? colors.primary : colors.textSecondary
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.pillText,
                  sortBy === "DATE_DESC" && styles.pillTextActive,
                ]}
              >
                Latest
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSortSelect("AMOUNT_DESC")}
              style={[
                styles.pill,
                sortBy === "AMOUNT_DESC" && styles.sortPillActive,
              ]}
            >
              <Ionicons
                name="trending-down-outline"
                size={14}
                color={
                  sortBy === "AMOUNT_DESC"
                    ? colors.primary
                    : colors.textSecondary
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.pillText,
                  sortBy === "AMOUNT_DESC" && styles.pillTextActive,
                ]}
              >
                High → Low
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSortSelect("AMOUNT_ASC")}
              style={[
                styles.pill,
                sortBy === "AMOUNT_ASC" && styles.sortPillActive,
              ]}
            >
              <Ionicons
                name="trending-up-outline"
                size={14}
                color={
                  sortBy === "AMOUNT_ASC"
                    ? colors.primary
                    : colors.textSecondary
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.pillText,
                  sortBy === "AMOUNT_ASC" && styles.pillTextActive,
                ]}
              >
                Low → High
              </Text>
            </Pressable>
          </ScrollView>
        </View>

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
      </View>
    ),
    [
      searchQuery,
      typeFilter,
      selectedWalletId,
      wallets,
      sortBy,
      totalIn,
      totalOut,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Transaction History"
        subtitle={`${filteredTransactions.length} records found`}
        rightAction={
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              router.push("/add-transaction");
            }}
            style={styles.addBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => setSelectedTx(item)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.groupHeader}>{title}</Text>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading && transactions.length === 0 ? (
            <TransactionSkeletonList count={6} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No Transactions Found"
              description="Try adjusting your search query, sorting, or filters to find what you're looking for."
              actionTitle={
                searchQuery ||
                typeFilter !== "ALL" ||
                selectedWalletId !== "ALL" ||
                sortBy !== "DATE_DESC"
                  ? "Reset Filters"
                  : "Add Transaction"
              }
              onAction={() => {
                hapticFeedback.light();
                if (
                  searchQuery ||
                  typeFilter !== "ALL" ||
                  selectedWalletId !== "ALL" ||
                  sortBy !== "DATE_DESC"
                ) {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                  setSelectedWalletId("ALL");
                  setSortBy("DATE_DESC");
                } else {
                  router.push("/add-transaction");
                }
              }}
            />
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

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
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  searchContainer: {
    marginTop: spacing.xs,
  },
  filterSection: {
    marginTop: spacing.md,
  },
  filterRowSection: {
    marginTop: spacing.md,
  },
  pillsScroll: {
    gap: spacing.sm,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  sortPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  pillDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
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
  groupHeader: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
});
