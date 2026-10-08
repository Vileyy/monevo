import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { CategoryIcon, Modal, SegmentedControl } from "@/components/ui";
import { Category } from "@/store/category.store";
import { categoryDisplayName } from "@/lib/format";
import { hapticFeedback } from "@/lib/haptics";

export interface CategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (category: Category) => void;
  onAddNew: () => void;
  initialType?: "EXPENSE" | "INCOME";
}

export function CategorySelectorModal({
  visible,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddNew,
  initialType = "EXPENSE",
}: CategorySelectorModalProps) {
  const [tabType, setTabType] = useState<"EXPENSE" | "INCOME">(initialType);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === tabType),
    [categories, tabType],
  );

  const handleSelect = (cat: Category) => {
    hapticFeedback.selection();
    onSelectCategory(cat);
    onClose();
  };

  const handleOpenAdd = () => {
    hapticFeedback.light();
    onClose();
    onAddNew();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Category">
      <View style={styles.container}>
        {/* Type Switcher: Expense vs Income */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            options={[
              {
                value: "EXPENSE",
                label: "Expense",
                icon: (
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={17}
                    color={
                      tabType === "EXPENSE"
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
                    size={17}
                    color={
                      tabType === "INCOME"
                        ? colors.income
                        : colors.textSecondary
                    }
                  />
                ),
                activeColor: colors.income,
                activeBgColor: colors.surface,
              },
            ]}
            value={tabType}
            onChange={(val) => {
              hapticFeedback.selection();
              setTabType(val);
            }}
          />
        </View>

        {/* Categories Grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          <View style={styles.grid}>
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const displayName = categoryDisplayName(cat.name);

              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleSelect(cat)}
                  style={({ pressed }) => [
                    styles.card,
                    isSelected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={displayName}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={colors.surface}
                      />
                    </View>
                  )}
                  <CategoryIcon name={displayName} type={tabType} size="md" />
                  <Text
                    style={[
                      styles.catName,
                      isSelected && styles.catNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                </Pressable>
              );
            })}

            {/* Add Custom Category Card */}
            <Pressable
              onPress={handleOpenAdd}
              style={({ pressed }) => [
                styles.card,
                styles.addCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add New Category"
            >
              <View style={styles.addCircle}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.addText}>Add New</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.sm,
  },
  segmentWrapper: {
    marginBottom: spacing.base,
  },
  scrollList: {
    paddingBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    width: "31%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    position: "relative",
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  catNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  addCard: {
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  addCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
