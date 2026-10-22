import React from "react";
import { ViewStyle } from "react-native";
import { IconBadge, IconBadgeSize } from "@/components/ui/IconBadge";
import { getCategoryMeta, IconName } from "@/lib/categories";

export interface CategoryIconProps {
  name?: string | null;
  type?: "EXPENSE" | "INCOME";
  size?: IconBadgeSize;
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

  return (
    <IconBadge
      icon={customIcon || meta.icon}
      color={customColor || meta.color}
      backgroundColor={customBgColor || meta.bgColor}
      size={size}
      style={style}
    />
  );
}
