import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/FloatingTabBar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Transaction,
  TransactionQueryParams,
  useTransactionStore,
} from "@/store/transaction.store";
import { useWalletStore } from "@/store/wallet.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatCurrency } from "@/lib/format";
import { hapticFeedback } from "@/lib/haptics";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import {
  EmptyState,
  Header,
  Input,
  SegmentedControl,
  TransactionSkeletonList,
} from "@/components/ui";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";
import { FilterDropdown } from "@/features/transactions/components/FilterDropdown";
import {
  SORT_OPTIONS,
  SortOption,
  sortOptionFor,
  walletFilterLabel,
  walletFilterOptions,
} from "@/features/transactions/utils/transaction-filters";

const SORT_QUERY: Record<
  Exclude<SortOption, "DATE_DESC">,
  Pick<TransactionQueryParams, "sortBy" | "sortOrder">
> = {
  AMOUNT_DESC: { sortBy: "amount", sortOrder: "desc" },
  AMOUNT_ASC: { sortBy: "amount", sortOrder: "asc" },
};

export default function TransactionsScreen() {
  const router = useRouter();
  const tabBarSpace = useTabBarSpace();
  useDisplayCurrency();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const {
    transactions,
    isLoading,
    isLoadingMore,
    pageMeta,
    summary,
    fetchTransactionsPage,
    loadMoreTransactions,
    fetchTransactionSummary,
  } = useTransactionStore();
  const { wallets, fetchWallets } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">(
    "ALL",
  );
  const [selectedWalletId, setSelectedWalletId] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Server-side query: filters, debounced search and sorting
  const serverQuery = useMemo<TransactionQueryParams>(() => {
    const query: TransactionQueryParams = {};
    if (typeFilter !== "ALL") query.type = typeFilter;
    if (selectedWalletId !== "ALL") query.walletId = selectedWalletId;
    if (debouncedSearch) query.search = debouncedSearch;
    if (sortBy !== "DATE_DESC") Object.assign(query, SORT_QUERY[sortBy]);
    return query;
  }, [typeFilter, selectedWalletId, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchTransactionsPage(serverQuery);
    fetchTransactionSummary(serverQuery);
  }, [serverQuery, fetchTransactionsPage, fetchTransactionSummary]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactionsPage(serverQuery),
      fetchTransactionSummary(serverQuery),
      fetchWallets(),
    ]);
    setRefreshing(false);
  };

  // Sections for SectionList (server already filtered/sorted)
  const sections = useMemo(() => {
    if (transactions.length === 0) return [];

    if (sortBy !== "DATE_DESC") {
      const label =
        sortBy === "AMOUNT_DESC"
          ? "Sorted: Highest → Lowest"
          : "Sorted: Lowest → Highest";
      return [{ title: label, data: transactions }];
    }

    const map = new Map<string, Transaction[]>();
    const order: string[] = [];
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    for (const tx of transactions) {
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
        order.push(label);
      }
      map.get(label)!.push(tx);
    }

    return order.map((title) => ({ title, data: map.get(title)! }));
  }, [transactions, sortBy]);

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    typeFilter !== "ALL" ||
    selectedWalletId !== "ALL" ||
    sortBy !== "DATE_DESC";

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setSelectedWalletId("ALL");
    setSortBy("DATE_DESC");
  };

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

  const handleCloseModal = () => {
    setSelectedTx(null);
    // Keep the summary bar exact after a delete happened in the modal
    fetchTransactionSummary(serverQuery);
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (pageMeta && !pageMeta.hasMore && transactions.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing all {pageMeta.total} records
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderHeader = useMemo(
    () => (
      <View>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search notes..."
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

        {/* Account & Sort Dropdowns */}
        <View style={styles.filterRowSection}>
          <FilterDropdown
            icon="wallet-outline"
            label={walletFilterLabel(wallets, selectedWalletId)}
            active={selectedWalletId !== "ALL"}
            options={walletFilterOptions(wallets)}
            value={selectedWalletId}
            onChange={handleWalletSelect}
            accessibilityLabel="Filter by account"
          />
          <FilterDropdown
            icon={sortOptionFor(sortBy).icon}
            label={sortOptionFor(sortBy).label}
            active={sortBy !== "DATE_DESC"}
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={handleSortSelect}
            accessibilityLabel="Sort transactions"
            style={styles.sortDropdown}
          />
        </View>

        {/* Summary Card from Server */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel} numberOfLines={1}>
              Total Income
            </Text>
            <Text
              style={[
                styles.summaryVal,
                compact && styles.summaryValCompact,
                { color: colors.income },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              +{formatCurrency(summary?.totalIncome ?? 0)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel} numberOfLines={1}>
              Total Expense
            </Text>
            <Text
              style={[
                styles.summaryVal,
                compact && styles.summaryValCompact,
                { color: colors.expense },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              −{formatCurrency(summary?.totalExpense ?? 0)}
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
      summary,
      compact,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Transaction History"
        subtitle={`${pageMeta?.total ?? 0} records found`}
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
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading && transactions.length === 0 ? (
            <TransactionSkeletonList count={6} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No Transactions Found"
              description="Try adjusting your search query, sorting, or filters to find what you're looking for."
              actionTitle={
                hasActiveFilters ? "Reset Filters" : "Add Transaction"
              }
              onAction={() => {
                hapticFeedback.light();
                if (hasActiveFilters) {
                  resetFilters();
                } else {
                  router.push("/add-transaction");
                }
              }}
            />
          )
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarSpace },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        onEndReachedThreshold={0.3}
        onEndReached={loadMoreTransactions}
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
        onClose={handleCloseModal}
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
  },
  searchContainer: {
    marginTop: spacing.xs,
  },
  filterSection: {
    marginTop: spacing.md,
  },
  filterRowSection: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  sortDropdown: {
    flex: 0,
    minWidth: 142,
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
    minWidth: 0,
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
    flexShrink: 1,
    ...typography.tabular,
  },
  summaryValCompact: {
    fontSize: 14,
    lineHeight: 18,
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
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  footerText: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
});
