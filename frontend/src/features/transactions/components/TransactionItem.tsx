import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "@/components/ui";
import { Transaction } from "@/store/transaction.store";
import { hapticFeedback } from "@/lib/haptics";

export interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  style?: ViewStyle;
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  onPress,
  style,
}: TransactionItemProps) {
  const isIncome = transaction.type === "INCOME";
  const categoryName = categoryDisplayName(
    transaction.category?.name || "Other",
  );
  const amountColor = isIncome ? colors.income : colors.expense;
  const sign = isIncome ? "+" : "−";

  // Format date nicely
  const txDate = new Date(transaction.date);
  const isToday = new Date().toDateString() === txDate.toDateString();
  const formattedTime = txDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = isToday
    ? `Today · ${formattedTime}`
    : `${txDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${formattedTime}`;

  const handlePress = () => {
    hapticFeedback.light();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`${categoryName}, ${transaction.note || ""}, ${sign}${formatCurrency(transaction.amount)}`}
    >
      <CategoryIcon
        name={categoryName}
        type={isIncome ? "INCOME" : "EXPENSE"}
        size="md"
      />

      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={styles.metaRow}>
          {transaction.wallet?.name && (
            <Text style={styles.walletTag} numberOfLines={1}>
              {transaction.wallet.name}
            </Text>
          )}
          {transaction.note ? (
            <Text style={styles.note} numberOfLines={1}>
              · {transaction.note}
            </Text>
          ) : (
            <Text style={styles.note} numberOfLines={1}>
              · {formattedDate}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.amountCol}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}
          {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.dateSubtext}>{formattedDate}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  pressed: {
    backgroundColor: colors.surfaceSecondary,
    transform: [{ scale: 0.99 }],
  },
  contentCol: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  walletTag: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 2,
    flexShrink: 1,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amount: {
    ...typography.headline,
    fontWeight: "700",
    ...typography.tabular,
  },
  dateSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
