import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "@/theme";
import { getWalletMeta } from "@/lib/categories";

export interface WalletIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function WalletIcon({ type, size = "md", style }: WalletIconProps) {
  const meta = getWalletMeta(type);

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
          borderRadius: radius.md,
          backgroundColor: meta.bgColor,
        },
        style,
      ]}
    >
      <Ionicons name={meta.icon} size={iconSize} color={meta.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
