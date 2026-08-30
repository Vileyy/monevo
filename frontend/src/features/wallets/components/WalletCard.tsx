import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatCurrency } from "@/lib/format";
import { getWalletMeta } from "@/lib/categories";
import { Wallet } from "@/store/wallet.store";

export interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  isSelected?: boolean;
}

export function WalletCard({
  wallet,
  onPress,
  style,
  compact = false,
  isSelected = false,
}: WalletCardProps) {
  const meta = getWalletMeta(wallet.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.standardCard,
        isSelected && styles.cardSelected,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${wallet.name} account, balance ${formatCurrency(wallet.balance)}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: meta.bgColor }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>

        <View style={styles.typeBadge}>
          <Text style={[styles.typeText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.name} numberOfLines={1}>
          {wallet.name}
        </Text>
        <Text style={styles.balance}>{formatCurrency(wallet.balance)}</Text>
      </View>
    </Pressable>
  );
}

export function AddWalletCardButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.compactCard,
        styles.addCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Add new wallet account"
    >
      <View style={styles.addIconCircle}>
        <Ionicons name="add" size={24} color={colors.primary} />
      </View>
      <Text style={styles.addTitle}>New Account</Text>
      <Text style={styles.addSubtitle}>Bank, Cash or Card</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
    ...shadows.sm,
  },
  standardCard: {
    width: "100%",
    minHeight: 120,
    marginBottom: spacing.md,
  },
  compactCard: {
    width: 170,
    height: 130,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryMuted,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  typeText: {
    ...typography.caption,
    fontWeight: "600",
    fontSize: 10,
    textTransform: "uppercase",
  },
  bottomSection: {
    marginTop: spacing.md,
  },
  name: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  balance: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
    ...typography.tabular,
  },
  addCard: {
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  addTitle: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
  addSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
