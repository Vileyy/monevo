import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/store/wallet.store";
import { Category, useCategoryStore } from "@/store/category.store";
import { useTransactionStore } from "@/store/transaction.store";
import { useBudgetStore } from "@/store/budget.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import {
  categoryDisplayName,
  formatCurrency,
  parseVndInput,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { DEFAULT_CATEGORY_METAS, getWalletMeta } from "@/lib/categories";
import { hapticFeedback } from "@/lib/haptics";
import { calculateBudgetWarning } from "@/lib/budget-warning";
import {
  Button,
  CategoryIcon,
  CurrencyInput,
  Header,
  Input,
} from "@/components/ui";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { CategorySelectorModal } from "@/features/categories/components/CategorySelectorModal";
import { WalletSelectorModal } from "@/features/wallets/components/WalletSelectorModal";
import { BudgetWarningBanner } from "@/features/budgets/components/BudgetWarningBanner";

export default function AddTransactionScreen() {
  const router = useRouter();
  const {
    wallets,
    hasFetched: walletsFetched,
    fetchWallets,
    createWallet,
  } = useWalletStore();
  const {
    categories,
    hasFetched: categoriesFetched,
    fetchCategories,
    createCategory,
  } = useCategoryStore();
  const { createTransaction, fetchTransactions } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didSeed = useRef(false);

  useEffect(() => {
    fetchWallets();
    fetchCategories();
    fetchBudgets();
  }, [fetchWallets, fetchCategories, fetchBudgets]);

  // Seed defaults if fresh account
  useEffect(() => {
    if (didSeed.current || !categoriesFetched || !walletsFetched) return;
    if (wallets.length > 0 && categories.length > 0) return;

    didSeed.current = true;
    void (async () => {
      try {
        if (wallets.length === 0) {
          await createWallet("Cash", "CASH", 0);
        }
        if (categories.length === 0) {
          for (const item of DEFAULT_CATEGORY_METAS) {
            await createCategory(item.name, item.type, item.icon);
          }
        }
      } catch {
        didSeed.current = false;
      }
    })();
  }, [
    categories.length,
    categoriesFetched,
    createCategory,
    createWallet,
    wallets.length,
    walletsFetched,
  ]);

  const selectedWalletId =
    walletId && wallets.some((w) => w.id === walletId)
      ? walletId
      : (wallets[0]?.id ?? null);

  const selectedWallet = useMemo(() => {
    return wallets.find((w) => w.id === selectedWalletId) || wallets[0] || null;
  }, [wallets, selectedWalletId]);

  const selectedWalletMeta = useMemo(() => {
    return getWalletMeta(selectedWallet?.type);
  }, [selectedWallet?.type]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const selectedCategoryId =
    categoryId && categories.some((c) => c.id === categoryId)
      ? categoryId
      : (visibleCategories[0]?.id ?? categories[0]?.id ?? null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  const selectedCategoryName = useMemo(() => {
    return selectedCategory
      ? categoryDisplayName(selectedCategory.name)
      : "Select Category";
  }, [selectedCategory]);

  const matchingBudget = useMemo(() => {
    if (type !== "EXPENSE" || !selectedCategoryId) return undefined;
    return budgets.find((b) => b.categoryId === selectedCategoryId);
  }, [type, selectedCategoryId, budgets]);

  const parsedAmount = useMemo(() => parseVndInput(amount) || 0, [amount]);

  const budgetWarning = useMemo(() => {
    if (type !== "EXPENSE" || !matchingBudget) return null;
    return calculateBudgetWarning(matchingBudget, parsedAmount);
  }, [type, matchingBudget, parsedAmount]);

  const handleSelectCategoryFromModal = (cat: Category) => {
    setCategoryId(cat.id);
    setType(cat.type as "EXPENSE" | "INCOME");
  };

  const handleSelectWalletFromModal = (id: string | null) => {
    if (id) {
      setWalletId(id);
    }
  };

  const executeSave = async (amountToSave: number) => {
    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: amountToSave,
        type,
        note: note.trim() || undefined,
        walletId: selectedWalletId!,
        categoryId: selectedCategoryId!,
      });

      hapticFeedback.success();
      await Promise.all([fetchWallets(), fetchTransactions(), fetchBudgets()]);
      router.back();
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

  const handleSave = async () => {
    const validAmount = parseVndInput(amount);
    if (!validAmount || validAmount <= 0) {
      hapticFeedback.warning();
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }

    if (!selectedWalletId) {
      hapticFeedback.warning();
      Alert.alert(
        "No Account Selected",
        "Please select an account or wait a moment for the default account to initialize.",
      );
      return;
    }

    if (!selectedCategoryId) {
      hapticFeedback.warning();
      Alert.alert(
        "No Category Selected",
        "Please select a category for this transaction.",
      );
      return;
    }

    // Budget overspending warning check
    if (type === "EXPENSE" && budgetWarning?.status === "EXCEEDED") {
      hapticFeedback.warning();
      const catDisplayName = selectedCategory
        ? categoryDisplayName(selectedCategory.name)
        : "this category";
      Alert.alert(
        "Budget Limit Exceeded",
        `This expense will exceed your monthly budget for "${catDisplayName}" by ${formatCurrency(budgetWarning.overAmount)}.\n\nDo you still want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Proceed",
            style: "destructive",
            onPress: () => {
              void executeSave(validAmount);
            },
          },
        ],
      );
      return;
    }

    await executeSave(validAmount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Add Transaction"
        showBack
        onBack={() => {
          hapticFeedback.light();
          router.back();
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Hero Amount Keypad Input */}
          <View style={styles.amountSection}>
            <CurrencyInput
              value={amount}
              onChangeText={setAmount}
              type={type}
              autoFocus
            />
          </View>

          {/* 2. Budget Warning Banner */}
          {type === "EXPENSE" &&
            budgetWarning &&
            budgetWarning.status !== "NONE" && (
              <View style={styles.budgetBannerSection}>
                <BudgetWarningBanner
                  warning={budgetWarning}
                  categoryName={selectedCategory?.name}
                />
              </View>
            )}

          {/* 3. Form Selection Card (Category & Account Rows) */}
          <View style={styles.formCard}>
            {/* Category Row */}
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setShowCategorySelector(true);
              }}
              style={({ pressed }) => [
                styles.formRow,
                pressed && styles.formRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${selectedCategoryName}`}
            >
              <View style={styles.rowLeft}>
                <CategoryIcon
                  name={selectedCategoryName}
                  type={type}
                  size="md"
                />
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowLabel}>Category</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {selectedCategoryName}
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <View
                  style={[
                    styles.typeBadge,
                    type === "INCOME"
                      ? styles.typeBadgeIncome
                      : styles.typeBadgeExpense,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      type === "INCOME"
                        ? styles.typeBadgeTextIncome
                        : styles.typeBadgeTextExpense,
                    ]}
                  >
                    {type === "INCOME" ? "Income" : "Expense"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>

            <View style={styles.divider} />

            {/* Account / Wallet Row */}
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setShowWalletSelector(true);
              }}
              style={({ pressed }) => [
                styles.formRow,
                pressed && styles.formRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Account: ${selectedWallet?.name || "Account"}`}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.walletIconCircle,
                    { backgroundColor: selectedWalletMeta.bgColor },
                  ]}
                >
                  <Ionicons
                    name={selectedWalletMeta.icon}
                    size={18}
                    color={selectedWalletMeta.color}
                  />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowLabel}>
                    {type === "INCOME" ? "Deposit To" : "Pay From"}
                  </Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {selectedWallet?.name || "Select Account"}
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.walletBalanceText}>
                  {formatCurrency(selectedWallet?.balance || 0)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>
          </View>

          {/* 4. Note Input */}
          <View style={styles.noteSection}>
            <Input
              label="Note (Optional)"
              placeholder="e.g. Lunch with team, Groceries..."
              value={note}
              onChangeText={setNote}
              leftIcon={
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={colors.primary}
                />
              }
            />
          </View>

          {/* 5. Save Button */}
          <Button
            title="Save Transaction"
            onPress={handleSave}
            isLoading={isSubmitting}
            size="lg"
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selector Bottom Sheet Modal */}
      <CategorySelectorModal
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategoryFromModal}
        onAddNew={() => setShowCategoryModal(true)}
        initialType={type}
      />

      {/* Account / Wallet Selector Bottom Sheet Modal */}
      <WalletSelectorModal
        visible={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelectWallet={handleSelectWalletFromModal}
        allowAllAccounts={false}
      />

      {/* Custom Category Modal */}
      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        initialType={type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.huge,
  },
  amountSection: {
    marginBottom: spacing.base,
  },
  budgetBannerSection: {
    marginBottom: spacing.base,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
    overflow: "hidden",
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
  },
  formRowPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  rowTextCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  rowValue: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: "700",
    marginTop: 2,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.base + 40,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  typeBadgeExpense: {
    backgroundColor: colors.expenseBg,
  },
  typeBadgeIncome: {
    backgroundColor: colors.incomeBg,
  },
  typeBadgeText: {
    ...typography.caption,
    fontWeight: "700",
    fontSize: 11,
  },
  typeBadgeTextExpense: {
    color: colors.expense,
  },
  typeBadgeTextIncome: {
    color: colors.income,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  walletBalanceText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  noteSection: {
    marginBottom: spacing.base,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
});
