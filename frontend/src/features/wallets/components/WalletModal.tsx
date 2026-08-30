import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, Input, Modal } from "@/components/ui";
import { formatVndInput, parseVndInput } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { useWalletStore, Wallet } from "@/store/wallet.store";

export interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  walletToEdit?: Wallet | null;
}

const WALLET_TYPES = [
  { type: "CASH", label: "Cash", icon: "cash-outline" as const },
  { type: "BANK", label: "Bank", icon: "business-outline" as const },
  { type: "CREDIT_CARD", label: "Credit Card", icon: "card-outline" as const },
];

function WalletForm({
  walletToEdit,
  onClose,
}: {
  walletToEdit?: Wallet | null;
  onClose: () => void;
}) {
  const { createWallet, updateWallet, deleteWallet } = useWalletStore();

  const [name, setName] = useState(walletToEdit?.name ?? "");
  const [type, setType] = useState(walletToEdit?.type ?? "CASH");
  const [balance, setBalance] = useState(
    walletToEdit ? formatVndInput(walletToEdit.balance.toString()) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an account name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedBalance = parseVndInput(balance);
      if (walletToEdit) {
        await updateWallet(walletToEdit.id, {
          name: name.trim(),
          type,
          balance: parsedBalance,
        });
      } else {
        await createWallet(name.trim(), type, parsedBalance);
      }
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not save wallet details."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!walletToEdit) return;

    Alert.alert(
      "Delete Wallet",
      `Are you sure you want to delete "${walletToEdit.name}"? Transactions associated with this wallet will also be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteWallet(walletToEdit.id);
              onClose();
            } catch (error) {
              Alert.alert(
                "Error",
                apiErrorMessage(error, "Could not delete this wallet."),
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
    <View style={styles.form}>
      <Input
        label="Account Name"
        placeholder="e.g. Daily Cash, Techcombank"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Input
        label="Starting Balance"
        placeholder="0"
        value={balance}
        onChangeText={(text) => setBalance(formatVndInput(text))}
        keyboardType="numeric"
        rightIcon={
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.textSecondary,
            }}
          >
            ₫
          </Text>
        }
      />

      <View style={styles.typeGroup}>
        <Text style={styles.typeLabel}>Account Type</Text>
        <View style={styles.typeRow}>
          {WALLET_TYPES.map((item) => {
            const isSelected = type === item.type;
            return (
              <Pressable
                key={item.type}
                onPress={() => setType(item.type)}
                style={[styles.typeBtn, isSelected && styles.typeBtnSelected]}
                accessibilityRole="button"
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    isSelected && styles.typeBtnTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title={walletToEdit ? "Save Changes" : "Create Account"}
        onPress={handleSubmit}
        isLoading={isSubmitting}
        size="lg"
        style={styles.submitBtn}
      />

      {walletToEdit && (
        <Button
          title="Delete Account"
          onPress={handleDelete}
          variant="danger"
          size="md"
          isLoading={isDeleting}
          style={styles.deleteBtn}
        />
      )}
    </View>
  );
}

export function WalletModal({
  visible,
  onClose,
  walletToEdit,
}: WalletModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={walletToEdit ? "Edit Account" : "New Account"}
      subtitle={
        walletToEdit
          ? "Update details or balance"
          : "Add cash, bank or credit card"
      }
    >
      <WalletForm
        key={walletToEdit?.id ?? "new"}
        walletToEdit={walletToEdit}
        onClose={onClose}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: spacing.xs,
  },
  typeGroup: {
    marginBottom: spacing.lg,
  },
  typeLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  typeBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  typeBtnText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 4,
  },
  typeBtnTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  deleteBtn: {
    marginTop: spacing.md,
  },
});
