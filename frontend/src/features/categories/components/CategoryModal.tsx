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
  { icon: "restaurant", color: "#C2410C", bgColor: "#FFF7ED" },
  { icon: "cart", color: "#BE185D", bgColor: "#FDF2F8" },
  { icon: "car", color: "#1D4ED8", bgColor: "#EFF6FF" },
  { icon: "receipt", color: "#A16207", bgColor: "#FEFCE8" },
  { icon: "cafe", color: "#B45309", bgColor: "#FFFBEB" },
  { icon: "home", color: "#4338CA", bgColor: "#EEF2FF" },
  { icon: "fitness", color: "#047857", bgColor: "#ECFDF5" },
  { icon: "film", color: "#6D28D9", bgColor: "#F5F3FF" },
  { icon: "medkit", color: "#B91C1C", bgColor: "#FEF2F2" },
  { icon: "school", color: "#0369A1", bgColor: "#F0F9FF" },
  { icon: "game-controller", color: "#7E22CE", bgColor: "#FAF5FF" },
  { icon: "airplane", color: "#0E7490", bgColor: "#ECFEFF" },
  { icon: "gift", color: "#0F766E", bgColor: "#F0FDFA" },
  { icon: "cash", color: "#047857", bgColor: "#ECFDF5" },
  { icon: "trending-up", color: "#047857", bgColor: "#ECFDF5" },
  { icon: "wallet", color: "#0F766E", bgColor: "#F0FDFA" },
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
    initialType === "INCOME" ? "cash" : "restaurant",
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
                    styles.iconTile,
                    { backgroundColor: item.bgColor },
                    isSelected && styles.iconTileSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
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
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  iconTileSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.06 }],
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
