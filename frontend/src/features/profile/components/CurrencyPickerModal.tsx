import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Modal } from "@/components/ui";
import { CurrencyCode, SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { useSettingsStore } from "@/store/settings.store";

export interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CurrencyPickerModal({
  visible,
  onClose,
}: CurrencyPickerModalProps) {
  const { currency: currentCurrency, setCurrency } = useSettingsStore();

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Currency">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        <Text style={styles.description}>
          Choose your preferred display currency for all balances, transactions,
          and analytics.
        </Text>

        {SUPPORTED_CURRENCIES.map((item) => {
          const isSelected = item.code === currentCurrency;
          return (
            <Pressable
              key={item.code}
              onPress={() => handleSelect(item.code)}
              style={({ pressed }) => [
                styles.itemRow,
                isSelected && styles.itemRowSelected,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.name}, ${item.code}, symbol ${item.symbol}`}
            >
              <View style={styles.flagContainer}>
                <Text style={styles.flagText}>{item.flag}</Text>
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Text style={styles.symbolBadge}>{item.symbol}</Text>
                </View>
                <Text style={styles.nameText}>{item.name}</Text>
              </View>

              <View style={styles.radioContainer}>
                {isSelected ? (
                  <View style={styles.radioChecked}>
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.surface}
                    />
                  </View>
                ) : (
                  <View style={styles.radioUnchecked} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.lg,
  },
  description: {
    ...typography.callout,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  itemRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  itemRowPressed: {
    opacity: 0.8,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  flagText: {
    fontSize: 22,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  codeText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  symbolBadge: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  nameText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioContainer: {
    marginLeft: spacing.sm,
  },
  radioChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
