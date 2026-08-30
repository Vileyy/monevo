import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, CategoryIcon, CurrencyInput, Modal } from "@/components/ui";
import { BudgetItem, useBudgetStore } from "@/store/budget.store";
import { useCategoryStore } from "@/store/category.store";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";

export interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budgetToEdit?: BudgetItem | null;
  month: number;
  year: number;
}

interface BudgetFormProps {
  budgetToEdit?: BudgetItem | null;
  month: number;
  year: number;
  onClose: () => void;
}

function BudgetForm({ budgetToEdit, month, year, onClose }: BudgetFormProps) {
  const { categories, fetchCategories } = useCategoryStore();
  const { createOrUpdateBudget } = useBudgetStore();

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "EXPENSE");
  }, [categories]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    budgetToEdit?.categoryId || expenseCategories[0]?.id || "",
  );
  const [amount, setAmount] = useState<string>(
    budgetToEdit ? formatCurrencyInput(budgetToEdit.amount.toString()) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      void fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  const handleSave = async () => {
    const numericAmount = parseCurrencyInput(amount);

    if (!selectedCategoryId) {
      Alert.alert("Required", "Please select a category.");
      return;
    }

    if (numericAmount <= 0) {
      Alert.alert("Required", "Please enter a valid budget amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrUpdateBudget(
        selectedCategoryId,
        numericAmount,
        month,
        year,
      );
      onClose();
    } catch (error) {
      Alert.alert("Error", apiErrorMessage(error, "Failed to save budget"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Category Picker */}
      <Text style={styles.sectionLabel}>Select Expense Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsList}
      >
        {expenseCategories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={({ pressed }) => [
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                pressed && styles.categoryChipPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${cat.name}`}
            >
              <CategoryIcon name={cat.name} type="EXPENSE" size="sm" />
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Amount Input */}
      <View style={styles.inputSpacing}>
        <CurrencyInput
          value={amount}
          onChangeText={setAmount}
          type="EXPENSE"
          autoFocus={!budgetToEdit}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onClose}
          style={styles.button}
        />
        <Button
          title={budgetToEdit ? "Update Budget" : "Set Budget"}
          onPress={handleSave}
          isLoading={isSubmitting}
          style={styles.button}
        />
      </View>
    </View>
  );
}

export function BudgetModal({
  visible,
  onClose,
  budgetToEdit,
  month,
  year,
}: BudgetModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={budgetToEdit ? "Edit Budget Limit" : "Set Category Budget"}
    >
      {visible ? (
        <BudgetForm
          key={`${budgetToEdit?.id || "new"}-${month}-${year}`}
          budgetToEdit={budgetToEdit}
          month={month}
          year={year}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  categoryChipsList: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  categoryChipPressed: {
    opacity: 0.8,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  inputSpacing: {
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
});
