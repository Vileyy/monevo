import * as SplashScreen from "expo-splash-screen";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows } from "@/theme";

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    70: {
      opacity: 0,
      easing: Easing.out(Easing.cubic),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1.05 }],
      easing: Easing.out(Easing.cubic),
    },
  });

  const splashContent = (
    <View style={styles.contentWrapper}>
      <View style={styles.logoBadge}>
        <Ionicons name="wallet" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.appName}>MONEVO</Text>
      <Text style={styles.appTagline}>SMART WEALTH TRACKING</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
    >
      {splashContent}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}
    >
      {splashContent}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  contentWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...shadows.lg,
  },
  appName: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#FFFFFF",
  },
  appTagline: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.primaryLight,
    marginTop: 6,
  },
});
