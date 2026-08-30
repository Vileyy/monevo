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
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore, Wallet } from "@/store/wallet.store";
import { Transaction, useTransactionStore } from "@/store/transaction.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import {
  EmptyState,
  TransactionSkeletonList,
  WalletSkeletonCard,
} from "@/components/ui";
import {
  AddWalletCardButton,
  WalletCard,
} from "@/features/wallets/components/WalletCard";
import { WalletSummaryCard } from "@/features/wallets/components/WalletSummaryCard";
import { WalletModal } from "@/features/wallets/components/WalletModal";
import { WalletSelectorModal } from "@/features/wallets/components/WalletSelectorModal";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

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

  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([fetchWallets(), fetchTransactions()]);
  }, [fetchWallets, fetchTransactions]);

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

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const displayedBalance = activeWallet ? activeWallet.balance : totalBalance;

  // Compute this month's in & out (filtered if activeWalletId is set)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  for (const tx of transactions) {
    if (activeWalletId && tx.walletId !== activeWalletId) {
      continue;
    }
    const d = new Date(tx.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (tx.type === "INCOME") {
        monthlyIncome += tx.amount;
      } else {
        monthlyExpense += tx.amount;
      }
    }
  }

  const displayedTransactions = useMemo(() => {
    if (!activeWalletId) return transactions;
    return transactions.filter((tx) => tx.walletId === activeWalletId);
  }, [transactions, activeWalletId]);

  const recentTransactions = displayedTransactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <Pressable
          style={({ pressed }) => [
            styles.userInfo,
            pressed && styles.userInfoPressed,
          ]}
          onPress={() => router.push("/(tabs)/profile")}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Go to Profile"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || "Member"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

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
        {/* Total / Account Balance Hero Card */}
        <WalletSummaryCard
          totalBalance={displayedBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          walletCount={wallets.length}
          selectedWalletName={activeWallet ? activeWallet.name : null}
          onOpenAccountSelector={() => setShowWalletSelector(true)}
          onAddTransaction={() => router.push("/add-transaction")}
          onAddWallet={() => {
            setSelectedWallet(null);
            setShowWalletModal(true);
          }}
        />

        {/* My Accounts Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/wallets")}
              hitSlop={8}
            >
              <Text style={styles.sectionLink}>Manage</Text>
            </Pressable>
          </View>

          {isWalletsLoading && wallets.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.base }}>
              <WalletSkeletonCard />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletsCarousel}
            >
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  compact
                  isSelected={activeWalletId === wallet.id}
                  onPress={() => {
                    setActiveWalletId((prev) =>
                      prev === wallet.id ? null : wallet.id,
                    );
                  }}
                />
              ))}

              <AddWalletCardButton
                onPress={() => {
                  setSelectedWallet(null);
                  setShowWalletModal(true);
                }}
              />
            </ScrollView>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {activeWallet && (
                <Pressable
                  onPress={() => setActiveWalletId(null)}
                  style={styles.activeFilterChip}
                  hitSlop={6}
                >
                  <Text style={styles.activeFilterText}>
                    {activeWallet.name} ✕
                  </Text>
                </Pressable>
              )}
            </View>
            {displayedTransactions.length > 0 && (
              <Pressable
                onPress={() => router.push("/(tabs)/transactions")}
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
      </ScrollView>

      {/* Account Selector Modal */}
      <WalletSelectorModal
        visible={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        wallets={wallets}
        selectedWalletId={activeWalletId}
        onSelectWallet={setActiveWalletId}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        walletToEdit={selectedWallet}
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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.headline,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  welcomeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.headline,
    color: colors.text,
    fontWeight: "700",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  logoutBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.9 }],
  },
  scrollContent: {
    paddingBottom: spacing.huge,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.text,
  },
  activeFilterChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeFilterText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  sectionLink: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
  walletsCarousel: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  transactionsContainer: {
    paddingHorizontal: spacing.base,
  },
});
