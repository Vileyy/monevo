import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";

export default function HomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
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

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Monevo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Compute this month's in & out
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (tx.type === "INCOME") {
        monthlyIncome += tx.amount;
      } else {
        monthlyExpense += tx.amount;
      }
    }
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
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
        </View>

        <Pressable
          onPress={handleLogout}
          style={styles.logoutBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons
            name="log-out-outline"
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
        {/* Total Balance Hero Card */}
        <WalletSummaryCard
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          walletCount={wallets.length}
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
                  onPress={() => {
                    setSelectedWallet(wallet);
                    setShowWalletModal(true);
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
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {transactions.length > 0 && (
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
                description="Start recording your daily income and spending to see your activity."
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
  sectionTitle: {
    ...typography.title3,
    color: colors.text,
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
