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
      "Xác nhận đã đóng tiền",
      `Ghi nhận đã đóng ${formatCurrency(reminder.amount)} cho khoản "${reminder.title}"?\n\nỨng dụng sẽ tự động trừ ví và lưu vào lịch sử chi tiêu.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đã đóng tiền ✔",
          onPress: async () => {
            try {
              hapticFeedback.success();
              await payReminder(reminder.id);
              if (onPaySuccess) onPaySuccess();
            } catch {
              hapticFeedback.error();
              Alert.alert(
                "Lỗi",
                "Không thể ghi nhận thanh toán. Vui lòng thử lại.",
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
      "Xóa lịch nhắc",
      `Bạn có chắc muốn xóa lịch nhắc "${reminder.title}"?`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            hapticFeedback.warning();
            void deleteReminder(reminder.id);
          },
        },
      ],
    );
  };

  // Human readable due date text in Vietnamese
  const getDueStatusText = () => {
    if (reminder.isPaidThisMonth) {
      return {
        label: "Đã đóng tháng này",
        color: colors.success,
        bg: colors.incomeBg,
        icon: "checkmark-circle" as const,
      };
    }
    if (reminder.status === "DUE_TODAY") {
      return {
        label: "Hôm nay đến hạn!",
        color: colors.danger,
        bg: colors.expenseBg,
        icon: "alert-circle" as const,
      };
    }
    if (reminder.status === "OVERDUE") {
      return {
        label: `Đã quá hạn ngày ${reminder.dueDate}`,
        color: colors.danger,
        bg: colors.expenseBg,
        icon: "warning" as const,
      };
    }
    if (reminder.status === "DUE_SOON") {
      return {
        label: `Hạn ngày ${reminder.dueDate} (Còn ${reminder.daysUntilDue} ngày)`,
        color: colors.warning,
        bg: colors.warningBg,
        icon: "time" as const,
      };
    }
    return {
      label: `Hạn ngày ${reminder.dueDate} hàng tháng`,
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
          accessibilityLabel={`Xóa nhắc nhở ${reminder.title}`}
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
            title="Đã đóng khoản này ✔"
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
