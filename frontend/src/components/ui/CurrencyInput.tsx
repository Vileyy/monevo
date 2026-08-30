import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatVndInput, parseVndInput } from "@/lib/format";

export interface CurrencyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  type?: "EXPENSE" | "INCOME";
  quickAmounts?: number[];
  error?: string;
  autoFocus?: boolean;
}

const DEFAULT_QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export function CurrencyInput({
  value,
  onChangeText,
  type = "EXPENSE",
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  error,
  autoFocus = false,
}: CurrencyInputProps) {
  const isIncome = type === "INCOME";
  const mainColor = isIncome ? colors.income : colors.expense;
  const currentNumericValue = parseVndInput(value);

  const handleQuickAdd = (amountToAdd: number) => {
    const nextVal = currentNumericValue + amountToAdd;
    onChangeText(formatVndInput(nextVal.toString()));
  };

  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amount</Text>

      <View
        style={[
          styles.inputCard,
          {
            borderColor: isIncome ? colors.incomeBorder : colors.expenseBorder,
          },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.currencyPrefix, { color: mainColor }]}>
            {isIncome ? "+" : "−"}₫
          </Text>
          <TextInput
            value={value}
            onChangeText={(text) => onChangeText(formatVndInput(text))}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoFocus={autoFocus}
            style={[styles.numericInput, { color: mainColor }]}
          />
          {!!value && (
            <Pressable
              onPress={handleClear}
              style={styles.clearBtn}
              hitSlop={8}
              accessibilityLabel="Clear amount"
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Quick Amount Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickAmountsList}
      >
        {quickAmounts.map((amt) => {
          const label =
            amt >= 1000000 ? `+${amt / 1000000}M` : `+${amt / 1000}k`;
          return (
            <Pressable
              key={amt}
              onPress={() => handleQuickAdd(amt)}
              style={({ pressed }) => [
                styles.quickChip,
                pressed && styles.quickChipPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${label}`}
            >
              <Text style={styles.quickChipText}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
    width: "100%",
  },
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: "700",
    marginRight: spacing.xs,
    ...typography.tabular,
  },
  numericInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    padding: 0,
    margin: 0,
    ...typography.tabular,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.footnote,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  quickAmountsList: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  quickChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipPressed: {
    backgroundColor: colors.border,
    transform: [{ scale: 0.96 }],
  },
  quickChipText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
