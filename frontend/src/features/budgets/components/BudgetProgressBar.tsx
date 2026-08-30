import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";

export interface BudgetProgressBarProps {
  percentage: number;
  height?: number;
}

export function BudgetProgressBar({
  percentage,
  height = 8,
}: BudgetProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  let barColor: string = colors.accent;
  if (percentage >= 100) {
    barColor = colors.danger;
  } else if (percentage >= 80) {
    barColor = colors.warning;
  }

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: barColor,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.full,
  },
});
