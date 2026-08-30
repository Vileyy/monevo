import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore, Wallet } from "@/store/wallet.store";
import { useSettingsStore } from "@/store/settings.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatCurrency } from "@/lib/format";
import { getWalletMeta } from "@/lib/categories";
import {
  Button,
  EmptyState,
  Header,
  SegmentedControl,
  WalletSkeletonCard,
} from "@/components/ui";
import { WalletModal } from "@/features/wallets/components/WalletModal";

export default function WalletsScreen() {
  const { wallets, isLoading, fetchWallets } = useWalletStore();
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "CASH" | "BANK" | "CREDIT_CARD"
  >("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  const filteredWallets = useMemo(() => {
    if (typeFilter === "ALL") return wallets;
    return wallets.filter((w) => w.type === typeFilter);
  }, [wallets, typeFilter]);

  const totalNetWorth = wallets.reduce((sum, w) => sum + w.balance, 0);

  const stats = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let card = 0;
    for (const w of wallets) {
      if (w.type === "CASH") cash += w.balance;
      else if (w.type === "BANK") bank += w.balance;
      else if (w.type === "CREDIT_CARD") card += w.balance;
    }
    return { cash, bank, card };
  }, [wallets]);

  const { currentLabel, currentBalance } = useMemo(() => {
    switch (typeFilter) {
      case "CASH":
        return { currentLabel: "Cash Balance", currentBalance: stats.cash };
      case "BANK":
        return { currentLabel: "Bank Balance", currentBalance: stats.bank };
      case "CREDIT_CARD":
        return { currentLabel: "Cards Balance", currentBalance: stats.card };
      case "ALL":
      default:
        return {
          currentLabel: "Total Net Worth",
          currentBalance: totalNetWorth,
        };
    }
  }, [typeFilter, stats, totalNetWorth]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Accounts & Wallets"
        subtitle={`${wallets.length} total accounts configured`}
        rightAction={
          <Pressable
            onPress={() => {
              setSelectedWallet(null);
              setShowModal(true);
            }}
            style={styles.addBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add account"
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
        {/* Net Worth Summary Card */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>{currentLabel}</Text>
          <Text style={styles.netWorthValue}>
            {hideBalance ? "••••••••" : formatCurrency(currentBalance)}
          </Text>

          <View style={styles.assetBreakdownRow}>
            <Pressable
              style={styles.assetCol}
              onPress={() =>
                setTypeFilter((prev) => (prev === "CASH" ? "ALL" : "CASH"))
              }
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Filter by cash, balance ${formatCurrency(stats.cash)}`}
            >
              <View style={[styles.assetDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.assetType}>Cash</Text>
              <Text style={styles.assetAmount}>
                {hideBalance ? "••••" : formatCurrency(stats.cash)}
              </Text>
            </Pressable>

            <View style={styles.assetDivider} />

            <Pressable
              style={styles.assetCol}
              onPress={() =>
                setTypeFilter((prev) => (prev === "BANK" ? "ALL" : "BANK"))
              }
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Filter by bank, balance ${formatCurrency(stats.bank)}`}
            >
              <View style={[styles.assetDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.assetType}>Bank</Text>
              <Text style={styles.assetAmount}>
                {hideBalance ? "••••" : formatCurrency(stats.bank)}
              </Text>
            </Pressable>

            <View style={styles.assetDivider} />

            <Pressable
              style={styles.assetCol}
              onPress={() =>
                setTypeFilter((prev) =>
                  prev === "CREDIT_CARD" ? "ALL" : "CREDIT_CARD",
                )
              }
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Filter by cards, balance ${formatCurrency(stats.card)}`}
            >
              <View style={[styles.assetDot, { backgroundColor: "#8B5CF6" }]} />
              <Text style={styles.assetType}>Cards</Text>
              <Text style={styles.assetAmount}>
                {hideBalance ? "••••" : formatCurrency(stats.card)}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Segment */}
        <View style={styles.segmentContainer}>
          <SegmentedControl
            options={[
              { value: "ALL", label: "All" },
              { value: "CASH", label: "Cash" },
              { value: "BANK", label: "Bank" },
              { value: "CREDIT_CARD", label: "Cards" },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </View>

        {/* Wallets List */}
        <View style={styles.listContainer}>
          {isLoading && wallets.length === 0 ? (
            <View style={{ gap: spacing.md }}>
              <WalletSkeletonCard />
              <WalletSkeletonCard />
            </View>
          ) : filteredWallets.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="No Accounts Found"
              description={
                typeFilter === "ALL"
                  ? "You don't have any wallets configured yet. Tap below to create your first account."
                  : "No accounts found for this filter."
              }
              actionTitle="Create Account"
              onAction={() => {
                setSelectedWallet(null);
                setShowModal(true);
              }}
            />
          ) : (
            filteredWallets.map((wallet) => {
              const meta = getWalletMeta(wallet.type);

              return (
                <Pressable
                  key={wallet.id}
                  onPress={() => {
                    setSelectedWallet(wallet);
                    setShowModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.walletRowCard,
                    pressed && styles.walletRowCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${wallet.name}, ${meta.label}, Balance ${formatCurrency(wallet.balance)}`}
                >
                  <View
                    style={[
                      styles.walletIconContainer,
                      { backgroundColor: meta.bgColor },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>

                  <View style={styles.walletDetails}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletType}>{meta.label}</Text>
                  </View>

                  <View style={styles.walletBalanceCol}>
                    <Text style={styles.walletBalance}>
                      {formatCurrency(wallet.balance)}
                    </Text>
                    <View style={styles.editActionRow}>
                      <Text style={styles.editActionText}>Tap to edit</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Add Account Button at Bottom */}
        <View style={styles.bottomAction}>
          <Button
            title="+ Add New Account"
            onPress={() => {
              setSelectedWallet(null);
              setShowModal(true);
            }}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Wallet Add / Edit Modal */}
      <WalletModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        walletToEdit={selectedWallet}
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
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },
  netWorthCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
    ...shadows.md,
  },
  netWorthLabel: {
    ...typography.subhead,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: spacing.xs,
    letterSpacing: -0.5,
    ...typography.tabular,
  },
  assetBreakdownRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  assetCol: {
    flex: 1,
    alignItems: "center",
  },
  assetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  assetType: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.6)",
  },
  assetAmount: {
    ...typography.footnote,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
    ...typography.tabular,
  },
  assetDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  segmentContainer: {
    marginBottom: spacing.base,
  },
  listContainer: {
    gap: spacing.md,
  },
  walletRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  walletRowCardPressed: {
    backgroundColor: colors.surfaceSecondary,
    transform: [{ scale: 0.99 }],
  },
  walletIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  walletDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  walletName: {
    ...typography.headline,
    color: colors.text,
  },
  walletType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletBalanceCol: {
    alignItems: "flex-end",
  },
  walletBalance: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
    ...typography.tabular,
  },
  editActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  editActionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginRight: 2,
  },
  bottomAction: {
    marginTop: spacing.xl,
  },
});
