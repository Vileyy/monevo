import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface WalletQuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const WalletQuickActions = memo(function WalletQuickActions({
  onAddIncome,
  onAddExpense,
}: WalletQuickActionsProps) {
  const handleAddIncome = () => {
    hapticFeedback.light();
    onAddIncome();
  };

  const handleAddExpense = () => {
    hapticFeedback.light();
    onAddExpense();
  };

  return (
    <View style={styles.actionBar}>
      <Pressable
        onPress={handleAddIncome}
        style={({ pressed }) => [
          styles.actionButton,
          styles.incomeAction,
          pressed && styles.actionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add income"
      >
        <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" />
        <Text style={styles.incomeActionText}>Add income</Text>
      </Pressable>

      <Pressable
        onPress={handleAddExpense}
        style={({ pressed }) => [
          styles.actionButton,
          styles.expenseAction,
          pressed && styles.actionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Ionicons name="arrow-up-circle" size={20} color={colors.expense} />
        <Text style={styles.expenseActionText}>Add expense</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  incomeAction: {
    flex: 1,
    backgroundColor: colors.income,
    ...shadows.sm,
  },
  incomeActionText: {
    ...typography.headline,
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  expenseAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    ...shadows.sm,
  },
  expenseActionText: {
    ...typography.headline,
    fontWeight: '700',
    color: colors.expense,
    marginLeft: spacing.xs,
  },
});
