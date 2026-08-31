import React, { memo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { BudgetItem } from "@/store/budget.store";
import { categoryDisplayName, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "@/components/ui";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { hapticFeedback } from "@/lib/haptics";

export interface BudgetCardProps {
  budget: BudgetItem;
  onEdit: () => void;
  onDelete: () => void;
}

export const BudgetCard = memo(function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const displayName = categoryDisplayName(budget.category.name);

  const isOverBudget = budget.spent > budget.amount;
  const isNearLimit = budget.percentage >= 80 && !isOverBudget;

  const handleEdit = () => {
    hapticFeedback.light();
    onEdit();
  };

  const handleDeletePress = () => {
    hapticFeedback.light();
    Alert.alert(
      "Delete Budget",
      `Are you sure you want to delete the ${displayName} budget?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            hapticFeedback.warning();
            onDelete();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Top Row: Category info & actions */}
      <View style={styles.topRow}>
        <View style={styles.categoryInfo}>
          <CategoryIcon name={budget.category.name} type="EXPENSE" size="sm" />
          <View style={styles.nameContainer}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.limitSubtitle}>
              Limit: {formatCurrency(budget.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleEdit}
            style={styles.actionBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${displayName} budget`}
          >
            <Ionicons name="pencil" size={15} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleDeletePress}
            style={styles.actionBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${displayName} budget`}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <BudgetProgressBar percentage={budget.percentage} height={8} />

        <View style={styles.progressMeta}>
          <Text style={styles.spentText}>
            Spent:{" "}
            <Text style={styles.spentAmount}>
              {formatCurrency(budget.spent)}
            </Text>
          </Text>
          <Text
            style={[
              styles.statusText,
              isOverBudget && styles.overBudgetText,
              isNearLimit && styles.nearLimitText,
            ]}
          >
            {isOverBudget
              ? `Over by ${formatCurrency(budget.spent - budget.amount)}`
              : `${budget.percentage}% used`}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nameContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  categoryName: {
    ...typography.headline,
    color: colors.text,
  },
  limitSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs + 2,
  },
  spentText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  spentAmount: {
    fontWeight: "700",
    color: colors.text,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  nearLimitText: {
    color: colors.warning,
  },
  overBudgetText: {
    color: colors.danger,
    fontWeight: "700",
  },
});
