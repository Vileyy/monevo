import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatCurrency } from "@/lib/format";
import { useSettingsStore } from "@/store/settings.store";

export interface WalletSummaryCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  walletCount: number;
  selectedWalletName?: string | null;
  onOpenAccountSelector?: () => void;
  onAddTransaction: () => void;
  onAddWallet: () => void;
}

export function WalletSummaryCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  walletCount,
  selectedWalletName,
  onOpenAccountSelector,
  onAddTransaction,
  onAddWallet,
}: WalletSummaryCardProps) {
  const { hideBalance, toggleHideBalance } = useSettingsStore();

  const isFiltered = Boolean(selectedWalletName);
  const cardTitle = isFiltered
    ? `${selectedWalletName} Balance`
    : "Total Balance";

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Top Meta Row */}
        <View style={styles.topRow}>
          <View style={styles.labelGroup}>
            <Text style={styles.balanceLabel} numberOfLines={1}>
              {cardTitle}
            </Text>
            <Pressable
              onPress={toggleHideBalance}
              style={styles.eyeBtn}
              hitSlop={8}
              accessibilityLabel="Toggle balance visibility"
            >
              <Ionicons
                name={hideBalance ? "eye-off-outline" : "eye-outline"}
                size={16}
                color="rgba(255, 255, 255, 0.75)"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={onOpenAccountSelector}
            style={({ pressed }) => [
              styles.accountBadge,
              isFiltered && styles.accountBadgeFiltered,
              pressed && styles.accountBadgePressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Switch account view"
          >
            <Text
              style={[
                styles.accountBadgeText,
                isFiltered && styles.accountBadgeTextFiltered,
              ]}
              numberOfLines={1}
            >
              {isFiltered
                ? selectedWalletName
                : `${walletCount} ${walletCount === 1 ? "Account" : "Accounts"}`}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={isFiltered ? colors.primaryDark : "#FFFFFF"}
              style={styles.chevronIcon}
            />
          </Pressable>
        </View>

        {/* Amount */}
        <Text style={styles.balanceValue}>
          {hideBalance ? "••••••••" : formatCurrency(totalBalance)}
        </Text>

        {/* Cashflow In / Out Pills */}
        <View style={styles.cashflowRow}>
          <View style={styles.cashflowPill}>
            <View style={[styles.miniDot, { backgroundColor: "#34D399" }]} />
            <Text style={styles.cashflowLabel}>Income</Text>
            <Text style={[styles.cashflowValue, { color: "#6EE7B7" }]}>
              {hideBalance ? "••••" : `+${formatCurrency(monthlyIncome)}`}
            </Text>
          </View>

          <View style={styles.cashflowPill}>
            <View style={[styles.miniDot, { backgroundColor: "#FB7185" }]} />
            <Text style={styles.cashflowLabel}>Expense</Text>
            <Text style={[styles.cashflowValue, { color: "#FDA4AF" }]}>
              {hideBalance ? "••••" : `−${formatCurrency(monthlyExpense)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={onAddTransaction}
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryAction,
            pressed && styles.actionPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Add Transaction</Text>
        </Pressable>

        <Pressable
          onPress={onAddWallet}
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            pressed && styles.actionPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add wallet"
        >
          <Ionicons name="wallet-outline" size={18} color={colors.text} />
          <Text style={styles.secondaryActionText}>New Wallet</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  balanceLabel: {
    ...typography.subhead,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  eyeBtn: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: 160,
  },
  accountBadgeFiltered: {
    backgroundColor: colors.primaryLight,
  },
  accountBadgePressed: {
    opacity: 0.75,
  },
  accountBadgeText: {
    ...typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  accountBadgeTextFiltered: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  chevronIcon: {
    marginLeft: 4,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: spacing.sm,
    letterSpacing: -0.5,
    ...typography.tabular,
  },
  cashflowRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cashflowPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cashflowLabel: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.6)",
    marginRight: 4,
  },
  cashflowValue: {
    ...typography.caption,
    fontWeight: "700",
    marginLeft: "auto",
    ...typography.tabular,
  },
  actionBar: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryAction: {
    flex: 1.4,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  primaryActionText: {
    ...typography.headline,
    color: "#FFFFFF",
    marginLeft: spacing.xs,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  secondaryActionText: {
    ...typography.subhead,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.xs,
  },
});
