import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { ReminderItem } from "@/store/reminder.store";
import { ReminderCard } from "./ReminderCard";
import { ReminderModal } from "./ReminderModal";

export interface ReminderSectionProps {
  reminders: ReminderItem[];
}

export function ReminderSection({ reminders }: ReminderSectionProps) {
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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No Bill Reminders</Text>
          <Text style={styles.emptyDescription}>
            Add recurring expenses like electricity, water, medicine, or rent to
            stay on top of payments.
          </Text>
          <Pressable
            onPress={() => setShowModal(true)}
            style={styles.emptyActionBtn}
          >
            <Text style={styles.emptyActionText}>+ Add First Reminder</Text>
          </Pressable>
        </View>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} />
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
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    color: colors.text,
    marginBottom: 4,
  },
  emptyDescription: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  emptyActionBtn: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyActionText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
});
