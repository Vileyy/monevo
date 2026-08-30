import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "@/theme";
import { getCategoryMeta, IconName } from "@/lib/categories";

export interface CategoryIconProps {
  name?: string | null;
  type?: "EXPENSE" | "INCOME";
  size?: "sm" | "md" | "lg";
  customIcon?: IconName;
  customColor?: string;
  customBgColor?: string;
  style?: ViewStyle;
}

export function CategoryIcon({
  name,
  type = "EXPENSE",
  size = "md",
  customIcon,
  customColor,
  customBgColor,
  style,
}: CategoryIconProps) {
  const meta = getCategoryMeta(name, type);
  const icon = customIcon || meta.icon;
  const color = customColor || meta.color;
  const bgColor = customBgColor || meta.bgColor;

  const getSizeSpecs = () => {
    switch (size) {
      case "sm":
        return { containerSize: 32, iconSize: 16 };
      case "lg":
        return { containerSize: 52, iconSize: 26 };
      case "md":
      default:
        return { containerSize: 42, iconSize: 20 };
    }
  };

  const { containerSize, iconSize } = getSizeSpecs();

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: radius.full,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
