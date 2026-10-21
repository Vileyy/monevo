import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { ReminderItem } from "@/store/reminder.store";
import { ReminderCard } from "./ReminderCard";
import { ReminderModal } from "./ReminderModal";

export interface ReminderSectionProps {
  reminders: ReminderItem[];
  onChanged?: () => void;
}

export function ReminderSection({
  reminders,
  onChanged,
}: ReminderSectionProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bills & Reminders</Text>

        <Pressable
          onPress={() => setShowModal(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add new bill reminder"
        >
          <Text style={styles.sectionLink}>+ Add</Text>
        </Pressable>
      </View>

      {reminders.length === 0 ? (
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [
            styles.emptyCard,
            pressed && styles.emptyCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add your first bill reminder"
        >
          <View style={styles.emptyIconBox}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyTitle}>No bills yet</Text>
            <Text style={styles.emptyDescription} numberOfLines={1}>
              Tap to track a recurring payment
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onPaySuccess={onChanged}
          />
        ))
      )}

      {/* Reminder Modal */}
      <ReminderModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.text,
  },
  sectionLink: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  emptyCardPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  emptyIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  emptyTitle: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: "700",
  },
  emptyDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
