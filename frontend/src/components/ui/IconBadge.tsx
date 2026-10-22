import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconName } from "@/lib/categories";

export type IconBadgeSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<IconBadgeSize, { box: number; icon: number }> = {
  xs: { box: 26, icon: 14 },
  sm: { box: 34, icon: 17 },
  md: { box: 42, icon: 20 },
  lg: { box: 52, icon: 24 },
};

export interface IconBadgeProps {
  icon: IconName;
  color: string;
  backgroundColor: string;
  size?: IconBadgeSize;
  style?: ViewStyle;
}

function withAlpha(hex: string, alpha: string) {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}

export function IconBadge({
  icon,
  color,
  backgroundColor,
  size = "md",
  style,
}: IconBadgeProps) {
  const spec = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: spec.box,
          height: spec.box,
          borderRadius: Math.round(spec.box * 0.32),
          backgroundColor,
          borderColor: withAlpha(color, "24"),
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={spec.icon} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
