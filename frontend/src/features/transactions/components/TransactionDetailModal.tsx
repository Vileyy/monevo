import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Badge, Button, CategoryIcon, Modal } from "@/components/ui";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { Transaction, useTransactionStore } from "@/store/transaction.store";
import { useWalletStore } from "@/store/wallet.store";

export interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const { deleteTransaction } = useTransactionStore();
  const { fetchWallets } = useWalletStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === "INCOME";
  const categoryName = categoryDisplayName(
    transaction.category?.name || "Other",
  );
  const amountColor = isIncome ? colors.income : colors.expense;
  const sign = isIncome ? "+" : "−";

  const txDate = new Date(transaction.date);
  const fullFormattedDate = `${txDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} at ${txDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this record? Your wallet balance will be adjusted accordingly.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteTransaction(transaction.id);
              await fetchWallets();
              onClose();
            } catch (error) {
              Alert.alert(
                "Error",
                apiErrorMessage(error, "Could not delete transaction."),
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Transaction Details">
      <View style={styles.content}>
        {/* Hero Amount Section */}
        <View style={styles.heroSection}>
          <CategoryIcon
            name={categoryName}
            type={isIncome ? "INCOME" : "EXPENSE"}
            size="lg"
          />
          <Text style={[styles.heroAmount, { color: amountColor }]}>
            {sign}
            {formatCurrency(transaction.amount)}
          </Text>
          <Badge
            label={isIncome ? "Income" : "Expense"}
            variant={isIncome ? "success" : "danger"}
            size="md"
            style={{ marginTop: spacing.xs }}
          />
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{categoryName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account</Text>
            <Text style={styles.detailValue}>
              {transaction.wallet?.name || "Account"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{fullFormattedDate}</Text>
          </View>

          {transaction.note ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note</Text>
                <Text style={styles.detailValue}>{transaction.note}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Delete Action */}
        <Button
          title="Delete Transaction"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          isLoading={isDeleting}
          leftIcon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
          style={styles.deleteBtn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: spacing.sm,
    ...typography.tabular,
  },
  detailCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.xs + 2,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    ...typography.headline,
    color: colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  deleteBtn: {
    marginTop: spacing.lg,
  },
});
