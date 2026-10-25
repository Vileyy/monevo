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
import { useTabBarSpace } from "@/components/FloatingTabBar";
import { useRouter } from "expo-router";
import { useWalletStore } from "@/store/wallet.store";
import { Transaction, useTransactionStore } from "@/store/transaction.store";
import { useReminderStore } from "@/store/reminder.store";
import { colors, spacing, typography } from "@/theme";
import { hapticFeedback } from "@/lib/haptics";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import {
  EmptyState,
  TransactionSkeletonList,
  WalletSkeletonCard,
} from "@/components/ui";
import { WalletCarousel } from "@/features/wallets/components/WalletCarousel";
import { WalletQuickActions } from "@/features/wallets/components/WalletQuickActions";
import { computeMonthlyFlows } from "@/features/wallets/utils/wallet-carousel";
import { ReminderSection } from "@/features/reminders/components/ReminderSection";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";
import { QuickTransactionModal } from "@/features/transactions/components/QuickTransactionModal";

export default function HomeScreen() {
  const router = useRouter();
  const tabBarSpace = useTabBarSpace();
  useDisplayCurrency();

  const {
    wallets,
    isLoading: isWalletsLoading,
    fetchWallets,
  } = useWalletStore();

  const {
    transactions,
    isLoading: isTransactionsLoading,
    fetchTransactions,
  } = useTransactionStore();

  const { reminders, fetchReminders } = useReminderStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [quickType, setQuickType] = useState<"INCOME" | "EXPENSE" | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([fetchWallets(), fetchTransactions(), fetchReminders()]);
  }, [fetchWallets, fetchTransactions, fetchReminders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeWallet = useMemo(() => {
    if (!activeWalletId) return null;
    return wallets.find((w) => w.id === activeWalletId) || null;
  }, [wallets, activeWalletId]);

  const monthlyFlows = useMemo(
    () => computeMonthlyFlows(transactions),
    [transactions],
  );

  const displayedTransactions = useMemo(() => {
    if (!activeWalletId) return transactions;
    return transactions.filter((tx) => tx.walletId === activeWalletId);
  }, [transactions, activeWalletId]);

  const recentTransactions = displayedTransactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarSpace },
        ]}
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
        {/* Wallet Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                router.push("/(tabs)/wallets");
              }}
              hitSlop={8}
            >
              <Text style={styles.sectionLink}>Manage</Text>
            </Pressable>
          </View>

          {isWalletsLoading && wallets.length === 0 ? (
            <View style={styles.walletSkeleton}>
              <WalletSkeletonCard />
            </View>
          ) : (
            <WalletCarousel
              wallets={wallets}
              monthlyFlows={monthlyFlows}
              activeWalletId={activeWalletId}
              onSelectWallet={setActiveWalletId}
            />
          )}

          <WalletQuickActions
            onAddIncome={() => setQuickType("INCOME")}
            onAddExpense={() => setQuickType("EXPENSE")}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {displayedTransactions.length > 0 && (
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  router.push("/(tabs)/transactions");
                }}
                hitSlop={8}
              >
                <Text style={styles.sectionLink}>See All</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.transactionsContainer}>
            {isTransactionsLoading && transactions.length === 0 ? (
              <TransactionSkeletonList count={3} />
            ) : recentTransactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No Transactions Yet"
                description={
                  activeWallet
                    ? `No activity found for ${activeWallet.name}.`
                    : "Start recording your daily income and spending to see your activity."
                }
                actionTitle="Add Transaction"
                onAction={() => router.push("/add-transaction")}
              />
            ) : (
              recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onPress={() => setSelectedTx(tx)}
                />
              ))
            )}
          </View>
        </View>

        {/* Reminders Section */}
        <ReminderSection reminders={reminders} onChanged={loadData} />
      </ScrollView>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />

      {/* Quick Income / Expense Modal */}
      <QuickTransactionModal
        key={quickType ?? "closed"}
        visible={quickType !== null}
        initialType={quickType ?? "EXPENSE"}
        onClose={() => setQuickType(null)}
        onSaved={loadData}
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
    paddingTop: spacing.base,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.text,
  },
  sectionLink: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
  walletSkeleton: {
    paddingHorizontal: spacing.base,
  },
  transactionsContainer: {
    paddingHorizontal: spacing.base,
  },
});
