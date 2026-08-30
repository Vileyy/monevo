import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { getCurrencyConfig } from "@/lib/currencies";
import { useSettingsStore } from "@/store/settings.store";

export interface CurrencyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  type?: "EXPENSE" | "INCOME";
  quickAmounts?: number[];
  error?: string;
  autoFocus?: boolean;
}

const DEFAULT_VND_QUICK = [50000, 100000, 200000, 500000, 1000000, 2000000];
const DEFAULT_DECIMAL_QUICK = [5, 10, 20, 50, 100, 200];

export function CurrencyInput({
  value,
  onChangeText,
  type = "EXPENSE",
  quickAmounts,
  error,
  autoFocus = false,
}: CurrencyInputProps) {
  const currencyCode = useSettingsStore((state) => state.currency);
  const currencyConfig = getCurrencyConfig(currencyCode);

  const activeQuickAmounts =
    quickAmounts ||
    (currencyConfig.precision === 0
      ? DEFAULT_VND_QUICK
      : DEFAULT_DECIMAL_QUICK);

  const isIncome = type === "INCOME";
  const mainColor = isIncome ? colors.income : colors.expense;
  const currentNumericValue = parseCurrencyInput(value, currencyCode);

  const handleQuickAdd = (amountToAdd: number) => {
    const nextVal = currentNumericValue + amountToAdd;
    onChangeText(formatCurrencyInput(nextVal.toString(), currencyCode));
  };

  const handleClear = () => {
    onChangeText("");
  };

  const formatQuickChipLabel = (amt: number) => {
    if (currencyConfig.precision === 0) {
      if (amt >= 1000000) return `+${amt / 1000000}M`;
      if (amt >= 1000) return `+${amt / 1000}k`;
      return `+${amt}`;
    }
    return `+${currencyConfig.symbol}${amt}`;
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
          <TextInput
            value={value}
            onChangeText={(text) =>
              onChangeText(formatCurrencyInput(text, currencyCode))
            }
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            autoFocus={autoFocus}
            style={[styles.numericInput, { color: mainColor }]}
          />

          <Text style={[styles.currencySuffix, { color: mainColor }]}>
            {currencyConfig.symbol}
          </Text>

          {!!value && (
            <Pressable
              onPress={handleClear}
              style={styles.clearBtn}
              hitSlop={8}
              accessibilityRole="button"
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
        {activeQuickAmounts.map((amt) => {
          const label = formatQuickChipLabel(amt);
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
    paddingVertical: spacing.sm + 2,
    minHeight: 64,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  numericInput: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: 44,
    ...typography.tabular,
    includeFontPadding: false,
    textAlignVertical: "center",
    ...Platform.select({
      ios: {
        marginTop: 2,
      },
    }),
  },
  currencySuffix: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
    ...typography.tabular,
    includeFontPadding: false,
  },
  clearBtn: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
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
    paddingRight: spacing.xl,
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
