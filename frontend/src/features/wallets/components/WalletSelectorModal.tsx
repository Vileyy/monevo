import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Modal } from "@/components/ui";
import { Wallet } from "@/store/wallet.store";
import { formatCurrency } from "@/lib/format";
import { getWalletMeta } from "@/lib/categories";
import { useSettingsStore } from "@/store/settings.store";

export interface WalletSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string | null) => void;
}

export function WalletSelectorModal({
  visible,
  onClose,
  wallets,
  selectedWalletId,
  onSelectWallet,
}: WalletSelectorModalProps) {
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleSelect = (walletId: string | null) => {
    onSelectWallet(walletId);
    onClose();
  };

  const isAllSelected = selectedWalletId === null;

  return (
    <Modal visible={visible} onClose={onClose} title="Select Account">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        <Text style={styles.description}>
          Choose an account to view its individual balance, cashflow, and recent
          activity.
        </Text>

        {/* All Accounts Option */}
        <Pressable
          onPress={() => handleSelect(null)}
          style={({ pressed }) => [
            styles.itemRow,
            isAllSelected && styles.itemRowSelected,
            pressed && styles.itemRowPressed,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: isAllSelected }}
          accessibilityLabel={`All Accounts, balance ${formatCurrency(totalBalance)}`}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="grid-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.nameText}>All Accounts</Text>
            <Text style={styles.subText}>
              {wallets.length} {wallets.length === 1 ? "Account" : "Accounts"}
            </Text>
          </View>

          <View style={styles.rightContainer}>
            <Text style={styles.balanceText}>
              {hideBalance ? "••••••••" : formatCurrency(totalBalance)}
            </Text>
            <View style={styles.radioContainer}>
              {isAllSelected ? (
                <View style={styles.radioChecked}>
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                </View>
              ) : (
                <View style={styles.radioUnchecked} />
              )}
            </View>
          </View>
        </Pressable>

        {/* Individual Wallets */}
        {wallets.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const meta = getWalletMeta(wallet.type);

          return (
            <Pressable
              key={wallet.id}
              onPress={() => handleSelect(wallet.id)}
              style={({ pressed }) => [
                styles.itemRow,
                isSelected && styles.itemRowSelected,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${wallet.name}, ${meta.label}, balance ${formatCurrency(wallet.balance)}`}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: meta.bgColor },
                ]}
              >
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {wallet.name}
                </Text>
                <Text style={styles.subText}>{meta.label}</Text>
              </View>

              <View style={styles.rightContainer}>
                <Text style={styles.balanceText}>
                  {hideBalance ? "••••••••" : formatCurrency(wallet.balance)}
                </Text>
                <View style={styles.radioContainer}>
                  {isSelected ? (
                    <View style={styles.radioChecked}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.surface}
                      />
                    </View>
                  ) : (
                    <View style={styles.radioUnchecked} />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.lg,
  },
  description: {
    ...typography.callout,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  itemRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  itemRowPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  subText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  balanceText: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
    ...typography.tabular,
  },
  radioContainer: {
    marginLeft: spacing.xs,
  },
  radioChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
