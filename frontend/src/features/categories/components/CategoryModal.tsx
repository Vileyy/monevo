import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, Input, Modal, SegmentedControl } from "@/components/ui";
import { apiErrorMessage } from "@/lib/api-error";
import { IconName } from "@/lib/categories";
import { useCategoryStore } from "@/store/category.store";

export interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: "EXPENSE" | "INCOME";
}

const AVAILABLE_ICONS: { icon: IconName; color: string; bgColor: string }[] = [
  { icon: "restaurant-outline", color: "#EA580C", bgColor: "#FFEDD5" },
  { icon: "cart-outline", color: "#DB2777", bgColor: "#FCE7F3" },
  { icon: "car-outline", color: "#2563EB", bgColor: "#DBEAFE" },
  { icon: "receipt-outline", color: "#CA8A04", bgColor: "#FEF08A" },
  { icon: "cafe-outline", color: "#B45309", bgColor: "#FEF3C7" },
  { icon: "home-outline", color: "#4F46E5", bgColor: "#EEF2FF" },
  { icon: "fitness-outline", color: "#059669", bgColor: "#D1FAE5" },
  { icon: "film-outline", color: "#7C3AED", bgColor: "#EDE9FE" },
  { icon: "medkit-outline", color: "#DC2626", bgColor: "#FEE2E2" },
  { icon: "school-outline", color: "#0284C7", bgColor: "#E0F2FE" },
  { icon: "game-controller-outline", color: "#9333EA", bgColor: "#F3E8FF" },
  { icon: "airplane-outline", color: "#0891B2", bgColor: "#CFFAFE" },
  { icon: "gift-outline", color: "#0D9488", bgColor: "#CCFBF1" },
  { icon: "cash-outline", color: "#10B981", bgColor: "#ECFDF5" },
  { icon: "trending-up-outline", color: "#059669", bgColor: "#D1FAE5" },
  { icon: "wallet-outline", color: "#0D9488", bgColor: "#E6F7F5" },
];

export function CategoryModal({
  visible,
  onClose,
  initialType = "EXPENSE",
}: CategoryModalProps) {
  const { createCategory } = useCategoryStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    initialType === "INCOME" ? "cash-outline" : "restaurant-outline",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a category name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCategory(name.trim(), type, selectedIcon);
      setName("");
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        apiErrorMessage(error, "Could not create category."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Category"
      subtitle="Create a custom spending or income category"
    >
      <View style={styles.form}>
        {/* Type Switcher */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            options={[
              { value: "EXPENSE", label: "Expense" },
              { value: "INCOME", label: "Income" },
            ]}
            value={type}
            onChange={setType}
          />
        </View>

        {/* Name Input */}
        <Input
          label="Category Name"
          placeholder="e.g. Coffee, Gym, Rent"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Icon Selector Grid */}
        <View style={styles.iconSection}>
          <Text style={styles.sectionLabel}>Select Icon</Text>
          <View style={styles.iconGrid}>
            {AVAILABLE_ICONS.map((item) => {
              const isSelected = selectedIcon === item.icon;
              return (
                <Pressable
                  key={item.icon}
                  onPress={() => setSelectedIcon(item.icon)}
                  style={[
                    styles.iconCircle,
                    { backgroundColor: item.bgColor },
                    isSelected && styles.iconCircleSelected,
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title="Create Category"
          onPress={handleSave}
          isLoading={isSubmitting}
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: spacing.xs,
  },
  segmentWrapper: {
    marginBottom: spacing.base,
  },
  iconSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconCircleSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
