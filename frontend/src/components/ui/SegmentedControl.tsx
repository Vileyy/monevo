import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  activeColor?: string;
  activeBgColor?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const activeBg = option.activeBgColor || colors.surface;
        const activeText = option.activeColor || colors.primary;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              isSelected && [
                styles.segmentActive,
                { backgroundColor: activeBg },
              ],
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            {option.icon && <View style={styles.iconSlot}>{option.icon}</View>}
            <Text
              style={[
                styles.segmentText,
                isSelected
                  ? [styles.segmentTextActive, { color: activeText }]
                  : styles.segmentTextInactive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.xxs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 2,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconSlot: {
    marginRight: spacing.xs,
  },
  segmentText: {
    ...typography.subhead,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  segmentTextInactive: {
    color: colors.textSecondary,
  },
});
