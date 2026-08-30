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
import { useCategoryStore } from "@/store/category.store";
import { useTransactionStore } from "@/store/transaction.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import {
  categoryDisplayName,
  formatCurrency,
  parseVndInput,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { DEFAULT_CATEGORY_METAS, getWalletMeta } from "@/lib/categories";
import {
  Button,
  CategoryIcon,
  CurrencyInput,
  Header,
  Input,
  SegmentedControl,
} from "@/components/ui";

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

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didSeed = useRef(false);

  useEffect(() => {
    fetchWallets();
    fetchCategories();
  }, [fetchWallets, fetchCategories]);

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

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const selectedWalletId =
    walletId && wallets.some((w) => w.id === walletId)
      ? walletId
      : (wallets[0]?.id ?? null);

  const selectedCategoryId =
    categoryId && visibleCategories.some((c) => c.id === categoryId)
      ? categoryId
      : (visibleCategories[0]?.id ?? null);

  const handleSave = async () => {
    const parsedAmount = parseVndInput(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }

    if (!selectedWalletId) {
      Alert.alert(
        "No Account Selected",
        "Please select an account or wait a moment for the default account to initialize.",
      );
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert(
        "No Category Selected",
        "Please select a category for this transaction.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: parsedAmount,
        type,
        note: note.trim() || undefined,
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });

      await Promise.all([fetchWallets(), fetchTransactions()]);
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not save transaction."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Transaction" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented Type Switch */}
          <View style={styles.segmentContainer}>
            <SegmentedControl
              options={[
                {
                  value: "EXPENSE",
                  label: "Expense",
                  icon: (
                    <Ionicons
                      name="arrow-up-circle-outline"
                      size={18}
                      color={
                        type === "EXPENSE"
                          ? colors.expense
                          : colors.textSecondary
                      }
                    />
                  ),
                  activeColor: colors.expense,
                  activeBgColor: colors.surface,
                },
                {
                  value: "INCOME",
                  label: "Income",
                  icon: (
                    <Ionicons
                      name="arrow-down-circle-outline"
                      size={18}
                      color={
                        type === "INCOME" ? colors.income : colors.textSecondary
                      }
                    />
                  ),
                  activeColor: colors.income,
                  activeBgColor: colors.surface,
                },
              ]}
              value={type}
              onChange={(newType) => {
                setType(newType);
                setCategoryId(null);
              }}
            />
          </View>

          {/* Amount Keypad Input */}
          <View style={styles.section}>
            <CurrencyInput
              value={amount}
              onChangeText={setAmount}
              type={type}
              autoFocus
            />
          </View>

          {/* Categories Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {visibleCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const catName = categoryDisplayName(cat.name);

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <CategoryIcon name={catName} type={type} size="md" />
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {catName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Wallet Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {type === "INCOME" ? "Deposit To Account" : "Pay From Account"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletChips}
            >
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                const meta = getWalletMeta(w.type);

                return (
                  <Pressable
                    key={w.id}
                    onPress={() => setWalletId(w.id)}
                    style={[
                      styles.walletChip,
                      isSelected && styles.walletChipSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.walletIconCircle,
                        { backgroundColor: meta.bgColor },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={16} color={meta.color} />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.walletChipTitle,
                          isSelected && styles.walletChipTitleSelected,
                        ]}
                      >
                        {w.name}
                      </Text>
                      <Text style={styles.walletChipBalance}>
                        {formatCurrency(w.balance)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Input
              label="Note (Optional)"
              placeholder="e.g. Lunch with team, Groceries"
              value={note}
              onChangeText={setNote}
              leftIcon={
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              }
            />
          </View>

          {/* Save Button */}
          <Button
            title="Save Transaction"
            onPress={handleSave}
            isLoading={isSubmitting}
            size="lg"
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  segmentContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  section: {
    marginBottom: spacing.base,
  },
  sectionLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryCard: {
    width: "31%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  categoryName: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  walletChips: {
    flexDirection: "row",
    gap: spacing.md,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 140,
    ...shadows.sm,
  },
  walletChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  walletChipTitle: {
    ...typography.subhead,
    fontWeight: "600",
    color: colors.text,
  },
  walletChipTitleSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  walletChipBalance: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
    ...typography.tabular,
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
