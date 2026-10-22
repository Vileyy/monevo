import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography } from "@/theme";
import {
  Button,
  CategoryIcon,
  CurrencyInput,
  Input,
  Modal,
  SegmentedControl,
  WalletIcon,
} from "@/components/ui";
import { categoryDisplayName, parseVndInput } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { hapticFeedback } from "@/lib/haptics";
import { calculateBudgetWarning } from "@/lib/budget-warning";
import { useWalletStore } from "@/store/wallet.store";
import { useCategoryStore } from "@/store/category.store";
import { useTransactionStore } from "@/store/transaction.store";
import { useBudgetStore } from "@/store/budget.store";
import {
  normalizeQuickNote,
  resolveCategoryId,
  resolveWalletId,
  validateQuickAmount,
} from "@/features/transactions/utils/quick-transaction";

export interface QuickTransactionModalProps {
  visible: boolean;
  initialType: "INCOME" | "EXPENSE";
  onClose: () => void;
  onSaved?: () => void;
}

export function QuickTransactionModal({
  visible,
  initialType,
  onClose,
  onSaved,
}: QuickTransactionModalProps) {
  const router = useRouter();
  const { wallets, fetchWallets } = useWalletStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { createTransaction, fetchTransactions } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();

  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void Promise.all([fetchWallets(), fetchCategories(), fetchBudgets()]);
  }, [visible, fetchWallets, fetchCategories, fetchBudgets]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const selectedWalletId = resolveWalletId(wallets, walletId);
  const selectedCategoryId = resolveCategoryId(categories, categoryId, type);

  const matchingBudget = useMemo(() => {
    if (type !== "EXPENSE" || !selectedCategoryId) return undefined;
    return budgets.find((budget) => budget.categoryId === selectedCategoryId);
  }, [type, selectedCategoryId, budgets]);

  const budgetWarning = useMemo(() => {
    if (type !== "EXPENSE" || !matchingBudget) return null;
    return calculateBudgetWarning(matchingBudget, parseVndInput(amount) || 0);
  }, [type, matchingBudget, amount]);

  const isReady = Boolean(selectedWalletId && selectedCategoryId);

  const persist = async (amountToSave: number) => {
    if (!selectedWalletId || !selectedCategoryId) return;

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: amountToSave,
        type,
        note: normalizeQuickNote(note),
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });

      hapticFeedback.success();
      await Promise.all([fetchWallets(), fetchTransactions(), fetchBudgets()]);
      onSaved?.();
      onClose();
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not save transaction."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    const validAmount = parseVndInput(amount);
    const amountError = validateQuickAmount(validAmount);
    if (amountError) {
      hapticFeedback.warning();
      Alert.alert("Invalid Amount", amountError);
      return;
    }

    if (!isReady) {
      hapticFeedback.warning();
      Alert.alert(
        "Missing Details",
        "Select an account and category before saving.",
      );
      return;
    }

    if (budgetWarning?.status === "EXCEEDED") {
      hapticFeedback.warning();
      Alert.alert(
        "Budget Limit Exceeded",
        `${budgetWarning.message}\n\nDo you still want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Proceed",
            style: "destructive",
            onPress: () => {
              void persist(validAmount);
            },
          },
        ],
      );
      return;
    }

    void persist(validAmount);
  };

  const openFullForm = () => {
    hapticFeedback.light();
    onClose();
    router.push("/add-transaction");
  };

  const isIncome = type === "INCOME";

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isIncome ? "Add money" : "Spend money"}
      subtitle="Saved to your account instantly"
    >
      <SegmentedControl
        options={[
          {
            value: "INCOME",
            label: "Money in",
            activeColor: colors.income,
            activeBgColor: colors.incomeBg,
          },
          {
            value: "EXPENSE",
            label: "Money out",
            activeColor: colors.expense,
            activeBgColor: colors.expenseBg,
          },
        ]}
        value={type}
        onChange={(nextType) => {
          hapticFeedback.selection();
          setType(nextType);
        }}
        style={styles.segments}
      />

      <CurrencyInput
        value={amount}
        onChangeText={setAmount}
        type={type}
        autoFocus={visible}
      />

      {visibleCategories.length === 0 || wallets.length === 0 ? (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>
            {wallets.length === 0
              ? "No account yet"
              : "No category for this type"}
          </Text>
          <Text style={styles.setupText}>
            Open the full form to set up your account and categories.
          </Text>
          <Button
            title="Open full form"
            variant="outline"
            size="sm"
            onPress={openFullForm}
            style={styles.setupButton}
          />
        </View>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {visibleCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    hapticFeedback.selection();
                    setCategoryId(category.id);
                  }}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    pressed && styles.chipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <CategoryIcon name={category.name} type={type} size="sm" />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {categoryDisplayName(category.name)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>
            {isIncome ? "Deposit to" : "Pay from"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {wallets.map((wallet) => {
              const isSelected = wallet.id === selectedWalletId;
              return (
                <Pressable
                  key={wallet.id}
                  onPress={() => {
                    hapticFeedback.selection();
                    setWalletId(wallet.id);
                  }}
                  style={({ pressed }) => [
                    styles.walletChip,
                    isSelected && styles.walletChipSelected,
                    pressed && styles.chipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <WalletIcon type={wallet.type} size="xs" />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <Input
            placeholder={
              isIncome
                ? "e.g. October salary, Freelance project"
                : "e.g. Lunch with team, Grab ride"
            }
            value={note}
            onChangeText={setNote}
            maxLength={140}
            returnKeyType="done"
            leftIcon={
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color={colors.textMuted}
              />
            }
          />

          {type === "EXPENSE" &&
            budgetWarning &&
            (budgetWarning.status === "WARNING" ||
              budgetWarning.status === "EXCEEDED") && (
              <View
                style={[
                  styles.warningRow,
                  budgetWarning.status === "EXCEEDED" &&
                    styles.warningRowDanger,
                ]}
              >
                <Ionicons
                  name={
                    budgetWarning.status === "EXCEEDED"
                      ? "alert-circle"
                      : "information-circle"
                  }
                  size={16}
                  color={
                    budgetWarning.status === "EXCEEDED"
                      ? colors.danger
                      : colors.warning
                  }
                />
                <Text
                  style={[
                    styles.warningText,
                    budgetWarning.status === "EXCEEDED" &&
                      styles.warningTextDanger,
                  ]}
                  numberOfLines={2}
                >
                  {budgetWarning.message}
                </Text>
              </View>
            )}

          <Button
            title={isIncome ? "Add money" : "Spend money"}
            onPress={handleSave}
            isLoading={isSubmitting}
            disabled={!isReady}
            size="lg"
            style={
              isIncome ? styles.saveIncomeButton : styles.saveExpenseButton
            }
          />
          <Pressable
            onPress={openFullForm}
            style={styles.moreLink}
            accessibilityRole="button"
          >
            <Text style={styles.moreLinkText}>Add a date or more details</Text>
          </Pressable>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  segments: {
    marginBottom: spacing.base,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
    marginBottom: spacing.base,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 180,
  },
  walletChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs + 2,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.base,
  },
  warningRowDanger: {
    backgroundColor: colors.expenseBg,
  },
  warningText: {
    ...typography.caption,
    color: "#92400E",
    flex: 1,
    lineHeight: 17,
  },
  warningTextDanger: {
    color: colors.danger,
  },
  saveIncomeButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.income,
  },
  saveExpenseButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.expense,
  },
  moreLink: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  moreLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  setupCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  setupTitle: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: "700",
  },
  setupText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  setupButton: {
    marginTop: spacing.sm,
  },
});
