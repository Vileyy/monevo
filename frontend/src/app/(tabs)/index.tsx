import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore } from "@/store/wallet.store";
import { useTransactionStore } from "@/store/transaction.store";
import { styles } from "@/features/wallets/styles/home.styles";
import { colors } from "@/theme/colors";
import {
  formatCurrency,
  walletTypeLabel,
  categoryDisplayName,
  parseVndInput,
  formatVndInput,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";

export default function HomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { wallets, isLoading, fetchWallets, createWallet } = useWalletStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("CASH");
  const [walletBalance, setWalletBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, [fetchWallets, fetchTransactions]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const recent = transactions.slice(0, 5);

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert("Name required", "Enter an account name before creating it.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWallet(walletName, walletType, parseVndInput(walletBalance));
      setWalletName("");
      setWalletBalance("");
      setShowAddForm(false);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        apiErrorMessage(err, "Could not create the wallet."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>{user?.name || "there"}</Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutButton}
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total balance</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(totalBalance)}
          </Text>
          <View style={styles.balanceCardFooter}>
            <Text style={styles.footerLabel}>Accounts</Text>
            <Text style={styles.footerValue}>{wallets.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.push("/add-transaction")}
        >
          <Text style={styles.primaryActionText}>Add transaction</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          {!showAddForm && (
            <TouchableOpacity onPress={() => setShowAddForm(true)}>
              <Text style={styles.sectionAction}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : wallets.length === 0 && !showAddForm ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              No wallets yet. Add a cash or bank account to start tracking
              spending.
            </Text>
          </View>
        ) : (
          <View style={styles.walletList}>
            {wallets.map((wallet) => (
              <View key={wallet.id} style={styles.walletRow}>
                <View>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletMeta}>
                    {walletTypeLabel(wallet.type)}
                  </Text>
                </View>
                <Text style={styles.walletBalance}>
                  {formatCurrency(wallet.balance)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {showAddForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>New account</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cash, Checking"
                value={walletName}
                onChangeText={setWalletName}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Starting balance</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="number-pad"
                value={walletBalance}
                onChangeText={(text) => setWalletBalance(formatVndInput(text))}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtonsContainer}>
                {["CASH", "BANK", "CREDIT_CARD"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      walletType === t && styles.typeButtonActive,
                    ]}
                    onPress={() => setWalletType(t)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        walletType === t && styles.typeButtonTextActive,
                      ]}
                    >
                      {walletTypeLabel(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateWallet}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create wallet</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
        </View>
        {recent.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              No transactions yet. Tap Add transaction to record income or
              expenses.
            </Text>
          </View>
        ) : (
          recent.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txTitle}>
                  {categoryDisplayName(
                    tx.category?.name || tx.note || "Transaction",
                  )}
                </Text>
                <Text style={styles.txMeta}>{tx.wallet?.name || ""}</Text>
              </View>
              <Text
                style={
                  tx.type === "INCOME"
                    ? styles.txAmountIncome
                    : styles.txAmountExpense
                }
              >
                {tx.type === "INCOME" ? "+" : "−"}
                {formatCurrency(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
