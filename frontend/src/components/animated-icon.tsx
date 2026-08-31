import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows } from "@/theme";

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [opacityAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [opacityAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.splashOverlay, { opacity: opacityAnim }]}
      pointerEvents="none"
    >
      <View style={styles.contentWrapper}>
        <View style={styles.logoBadge}>
          <Ionicons name="wallet" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>MONEVO</Text>
        <Text style={styles.appTagline}>SMART WEALTH TRACKING</Text>
      </View>
    </Animated.View>
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
