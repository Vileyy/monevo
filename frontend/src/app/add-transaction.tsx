import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useWalletStore } from "@/store/wallet.store";
import { useCategoryStore } from "@/store/category.store";
import { useTransactionStore } from "@/store/transaction.store";
import { styles } from "@/features/transactions/styles/add.styles";
import { colors } from "@/theme/colors";
import {
  walletTypeLabel,
  categoryDisplayName,
  parseVndInput,
  formatVndInput,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "EXPENSE" },
  { name: "Transport", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Bills", type: "EXPENSE" },
  { name: "Salary", type: "INCOME" },
  { name: "Other income", type: "INCOME" },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const {
    wallets,
    hasFetched: walletsFetched,
    fetchWallets,
    createWallet,
  } = useWalletStore();
  const { categories, hasFetched, fetchCategories, createCategory } =
    useCategoryStore();
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

  useEffect(() => {
    if (didSeed.current || !hasFetched || !walletsFetched) return;
    if (wallets.length > 0 && categories.length > 0) return;

    didSeed.current = true;
    void (async () => {
      try {
        if (wallets.length === 0) {
          await createWallet("Cash", "CASH", 0);
        }
        if (categories.length === 0) {
          for (const item of DEFAULT_CATEGORIES) {
            await createCategory(item.name, item.type);
          }
        }
      } catch {
        didSeed.current = false;
      }
    })();
  }, [
    categories.length,
    createCategory,
    createWallet,
    hasFetched,
    wallets.length,
    walletsFetched,
  ]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const selectedWalletId =
    walletId && wallets.some((wallet) => wallet.id === walletId)
      ? walletId
      : (wallets[0]?.id ?? null);

  const selectedCategoryId =
    categoryId &&
    visibleCategories.some((category) => category.id === categoryId)
      ? categoryId
      : (visibleCategories[0]?.id ?? null);

  const handleSubmit = async () => {
    const parsed = parseVndInput(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert("Invalid amount", "Enter a number greater than 0.");
      return;
    }
    if (!selectedWalletId) {
      Alert.alert(
        "No wallet",
        "A Cash account is being created. Try Save again in a moment.",
      );
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert(
        "No category",
        "Select a category or wait for defaults to load.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: parsed,
        type,
        note: note.trim() || undefined,
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });
      await fetchWallets();
      await fetchTransactions();
      router.back();
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        apiErrorMessage(err, "Could not save the transaction."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add transaction</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {(["EXPENSE", "INCOME"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, type === item && styles.chipActive]}
                onPress={() => setType(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    type === item && styles.chipTextActive,
                  ]}
                >
                  {item === "EXPENSE" ? "Expense" : "Income"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="0"
            value={amount}
            onChangeText={(text) => setAmount(formatVndInput(text))}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account</Text>
          <View style={styles.chips}>
            {wallets.length === 0 ? (
              <Text style={styles.chipText}>Creating a Cash account…</Text>
            ) : (
              wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.chip,
                    selectedWalletId === wallet.id && styles.chipActive,
                  ]}
                  onPress={() => setWalletId(wallet.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedWalletId === wallet.id && styles.chipTextActive,
                    ]}
                  >
                    {wallet.name} · {walletTypeLabel(wallet.type)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {visibleCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.chip,
                  selectedCategoryId === category.id && styles.chipActive,
                ]}
                onPress={() => setCategoryId(category.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategoryId === category.id && styles.chipTextActive,
                  ]}
                >
                  {categoryDisplayName(category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            value={note}
            onChangeText={setNote}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={styles.submit}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
