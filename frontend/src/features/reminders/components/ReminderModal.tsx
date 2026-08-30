import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, CurrencyInput, Input, Modal } from "@/components/ui";
import { useReminderStore } from "@/store/reminder.store";
import { REMINDER_PRESETS, ReminderCategoryMeta } from "@/lib/reminders";
import { parseCurrencyInput } from "@/lib/format";

export interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReminderModal({ visible, onClose }: ReminderModalProps) {
  const { createReminder } = useReminderStore();

  const [selectedPreset, setSelectedPreset] = useState<ReminderCategoryMeta>(
    REMINDER_PRESETS[0],
  );
  const [title, setTitle] = useState(REMINDER_PRESETS[0].defaultTitle);
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset: ReminderCategoryMeta) => {
    setSelectedPreset(preset);
    setTitle(preset.defaultTitle);
  };

  const handleSave = async () => {
    const numericAmount = parseCurrencyInput(amount);

    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên khoản nhắc nhở.");
      return;
    }

    if (numericAmount <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReminder({
        title: title.trim(),
        amount: numericAmount,
        dueDate: dueDay,
        category: selectedPreset.category,
      });
      setTitle(REMINDER_PRESETS[0].defaultTitle);
      setAmount("");
      setDueDay(10);
      onClose();
    } catch {
      Alert.alert("Lỗi", "Không thể tạo lịch nhắc. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Thêm Lịch Nhắc Tiền">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Quick Pick Templates */}
        <Text style={styles.sectionLabel}>Chọn loại khoản chi</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsList}
        >
          {REMINDER_PRESETS.map((preset) => {
            const isSelected = selectedPreset.category === preset.category;
            return (
              <Pressable
                key={preset.category}
                onPress={() => handleSelectPreset(preset)}
                style={({ pressed }) => [
                  styles.presetChip,
                  isSelected && styles.presetChipSelected,
                  pressed && styles.presetChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={preset.label}
              >
                <View
                  style={[
                    styles.presetIconCircle,
                    { backgroundColor: preset.bgColor },
                  ]}
                >
                  <Ionicons name={preset.icon} size={18} color={preset.color} />
                </View>
                <Text
                  style={[
                    styles.presetChipText,
                    isSelected && styles.presetChipTextSelected,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Title Input */}
        <Input
          label="Tên khoản chi / thuốc"
          placeholder="Ví dụ: Tiền thuốc huyết áp, Tiền điện..."
          value={title}
          onChangeText={setTitle}
        />

        {/* Amount Input */}
        <View style={styles.inputSpacing}>
          <CurrencyInput
            value={amount}
            onChangeText={setAmount}
            type="EXPENSE"
          />
        </View>

        {/* Due Day Selector (Day of month 1 - 31) */}
        <View style={styles.dueDayContainer}>
          <Text style={styles.sectionLabel}>Ngày đến hạn trong tháng</Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setDueDay((d) => Math.max(1, d - 1))}
              style={styles.stepperBtn}
              hitSlop={8}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>

            <View style={styles.dueDayBadge}>
              <Text style={styles.dueDayText}>Ngày {dueDay}</Text>
              <Text style={styles.dueDaySub}>hàng tháng</Text>
            </View>

            <Pressable
              onPress={() => setDueDay((d) => Math.min(31, d + 1))}
              style={styles.stepperBtn}
              hitSlop={8}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Hủy"
            variant="secondary"
            onPress={onClose}
            style={styles.button}
          />
          <Button
            title="Lưu Nhắc Nhở"
            onPress={handleSave}
            isLoading={isSubmitting}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  presetsList: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  presetChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  presetChipPressed: {
    opacity: 0.8,
  },
  presetIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  presetChipText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  presetChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  inputSpacing: {
    marginTop: spacing.xs,
  },
  dueDayContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl,
    padding: spacing.sm,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueDayBadge: {
    alignItems: "center",
  },
  dueDayText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.primary,
  },
  dueDaySub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
});
