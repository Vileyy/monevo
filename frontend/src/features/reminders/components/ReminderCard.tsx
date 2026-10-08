import React, { memo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { ReminderItem, useReminderStore } from "@/store/reminder.store";
import { formatCurrency } from "@/lib/format";
import { getReminderCategoryMeta } from "@/lib/reminders";
import { Button } from "@/components/ui";
import { hapticFeedback } from "@/lib/haptics";

export interface ReminderCardProps {
  reminder: ReminderItem;
  onPaySuccess?: () => void;
}

export const ReminderCard = memo(function ReminderCard({
  reminder,
  onPaySuccess,
}: ReminderCardProps) {
  const { payReminder, deleteReminder } = useReminderStore();
  const meta = getReminderCategoryMeta(reminder.category);

  const handlePayPress = () => {
    hapticFeedback.light();
    Alert.alert(
      "Confirm Payment",
      `Record payment of ${formatCurrency(reminder.amount)} for "${reminder.title}"?\n\nThis will deduct from your account balance and save to transaction history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Paid ✔",
          onPress: async () => {
            try {
              hapticFeedback.success();
              await payReminder(reminder.id);
              if (onPaySuccess) onPaySuccess();
            } catch {
              hapticFeedback.error();
              Alert.alert(
                "Error",
                "Could not record payment. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeletePress = () => {
    hapticFeedback.light();
    Alert.alert(
      "Delete Reminder",
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            hapticFeedback.warning();
            void deleteReminder(reminder.id);
          },
        },
      ],
    );
  };

  // Human readable due date text in English
  const getDueStatusText = () => {
    if (reminder.isPaidThisMonth) {
      return {
        label: "Paid this month",
        color: colors.success,
        bg: colors.incomeBg,
        icon: "checkmark-circle" as const,
      };
    }
    if (reminder.status === "DUE_TODAY") {
      return {
        label: "Due today!",
        color: colors.danger,
        bg: colors.expenseBg,
        icon: "alert-circle" as const,
      };
    }
    if (reminder.status === "OVERDUE") {
      return {
        label: `Overdue since day ${reminder.dueDate}`,
        color: colors.danger,
        bg: colors.expenseBg,
        icon: "warning" as const,
      };
    }
    if (reminder.status === "DUE_SOON") {
      return {
        label: `Due day ${reminder.dueDate} (${reminder.daysUntilDue} days left)`,
        color: colors.warning,
        bg: colors.warningBg,
        icon: "time" as const,
      };
    }
    return {
      label: `Due day ${reminder.dueDate} monthly`,
      color: colors.textSecondary,
      bg: colors.surfaceSecondary,
      icon: "calendar-outline" as const,
    };
  };

  const dueInfo = getDueStatusText();

  return (
    <View style={styles.card}>
      {/* Top Row: Icon + Title + Delete button */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: meta.bgColor }]}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={1}>
              {reminder.title}
            </Text>
            <Text style={styles.categoryLabel}>{meta.label}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleDeletePress}
          style={styles.deleteBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete reminder ${reminder.title}`}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Middle Row: Amount & Status Badge */}
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatCurrency(reminder.amount)}</Text>

        <View style={[styles.statusBadge, { backgroundColor: dueInfo.bg }]}>
          <Ionicons
            name={dueInfo.icon}
            size={13}
            color={dueInfo.color}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusBadgeText, { color: dueInfo.color }]}>
            {dueInfo.label}
          </Text>
        </View>
      </View>

      {/* Bottom Row: 1-Tap Pay Action */}
      {!reminder.isPaidThisMonth && (
        <View style={styles.actionRow}>
          <Button
            title="Mark as Paid ✔"
            onPress={handlePayPress}
            size="md"
            style={styles.payButton}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  amount: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
    ...typography.tabular,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: spacing.md,
  },
  payButton: {
    backgroundColor: colors.primary,
  },
});
