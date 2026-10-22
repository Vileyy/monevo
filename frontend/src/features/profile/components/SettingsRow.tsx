import React from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";

export interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
  showChevron?: boolean;
  disabled?: boolean;
}

export function SettingsRow({
  icon,
  iconColor = colors.primary,
  iconBgColor = colors.primaryMuted,
  title,
  subtitle,
  value,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  destructive = false,
  style,
  showChevron = true,
  disabled = false,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: destructive ? colors.expenseBg : iconBgColor },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.danger : iconColor}
        />
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            destructive && { color: colors.danger, fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
          disabled={disabled}
        />
      ) : (
        <View style={styles.rightContainer}>
          {value ? <Text style={styles.valueText}>{value}</Text> : null}
          {showChevron && !destructive ? (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          ) : null}
        </View>
      )}
    </View>
  );

  if (isSwitch || !onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  valueText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: "hidden",
  },
});
