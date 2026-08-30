import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radius } from "@/theme";

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function TransactionSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.skeletonRow}>
          <Skeleton width={42} height={42} borderRadius={radius.full} />
          <View style={styles.skeletonTextCol}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="35%" height={12} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={80} height={18} />
        </View>
      ))}
    </View>
  );
}

export function WalletSkeletonCard() {
  return (
    <View style={styles.walletCardSkeleton}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="70%" height={26} style={{ marginTop: 12 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Skeleton width={80} height={12} />
        <Skeleton width={60} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  listContainer: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skeletonTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  walletCardSkeleton: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
  },
});
