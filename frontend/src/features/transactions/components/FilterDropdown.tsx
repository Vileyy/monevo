import React, { useRef, useState } from "react";
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { hapticFeedback } from "@/lib/haptics";
import type { IconName } from "@/lib/categories";
import type { FilterOption } from "../utils/transaction-filters";

interface MenuAnchor {
  top: number;
  left: number;
  width: number;
}

export interface FilterDropdownProps<T extends string> {
  icon: IconName;
  label: string;
  active?: boolean;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  style?: ViewStyle;
}

export function FilterDropdown<T extends string>({
  icon,
  label,
  active = false,
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: FilterDropdownProps<T>) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      hapticFeedback.light();
      setAnchor({ top: y + height + spacing.xs, left: x, width });
    });
  };

  const close = () => setAnchor(null);

  const menuWidth = anchor
    ? Math.min(Math.max(anchor.width, 208), screenWidth - spacing.base * 2)
    : 0;
  const menuLeft = anchor
    ? Math.min(anchor.left, screenWidth - menuWidth - spacing.base)
    : 0;

  return (
    <View ref={triggerRef} collapsable={false} style={[styles.wrapper, style]}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.trigger,
          active && styles.triggerActive,
          pressed && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: anchor !== null }}
      >
        <Ionicons
          name={icon}
          size={16}
          color={active ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[styles.triggerText, active && styles.triggerTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={active ? colors.primary : colors.textMuted}
        />
      </Pressable>

      {anchor && (
        <RNModal
          transparent
          visible
          animationType="fade"
          statusBarTranslucent
          onRequestClose={close}
        >
          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <View
            style={[
              styles.menuShadow,
              { top: anchor.top, left: menuLeft, width: menuWidth },
            ]}
          >
            <View style={styles.menu}>
              <ScrollView bounces={false}>
                {options.map((option, index) => {
                  const selected = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        hapticFeedback.selection();
                        onChange(option.value);
                        close();
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        index < options.length - 1 && styles.rowDivider,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected }}
                    >
                      {option.icon ? (
                        <Ionicons
                          name={option.icon}
                          size={17}
                          color={
                            selected ? colors.primary : colors.textSecondary
                          }
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.rowText,
                          selected && styles.rowTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  trigger: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  triggerPressed: {
    opacity: 0.9,
  },
  triggerText: {
    ...typography.footnote,
    flex: 1,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  triggerTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  menuShadow: {
    position: "absolute",
    borderRadius: radius.lg,
    ...shadows.lg,
  },
  menu: {
    maxHeight: 320,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.base,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  rowText: {
    ...typography.subhead,
    flex: 1,
    color: colors.text,
    fontWeight: "600",
  },
  rowTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
