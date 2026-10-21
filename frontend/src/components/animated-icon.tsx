import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadows, spacing } from "@/theme";
import { useAuthStore } from "@/store/auth.store";

const INTRO_DURATION = 1600;
const ZOOM_DURATION = 480;

export function AnimatedSplashOverlay() {
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [visible, setVisible] = useState(true);
  const [introDone, setIntroDone] = useState(false);

  const [opacityAnim] = useState(() => new Animated.Value(1));
  const [zoom] = useState(() => new Animated.Value(1));
  const [badgeScale] = useState(() => new Animated.Value(0.7));
  const [badgeOpacity] = useState(() => new Animated.Value(0));
  const [glowOpacity] = useState(() => new Animated.Value(0));
  const [glowScale] = useState(() => new Animated.Value(0.85));
  const [ringOpacity] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  const [copyOpacity] = useState(() => new Animated.Value(0));
  const [copyTranslate] = useState(() => new Animated.Value(14));

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    Animated.parallel([
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.5,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.22,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowScale, {
        toValue: 1.12,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(copyOpacity, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
          }),
          Animated.timing(copyTranslate, {
            toValue: 0,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    return () => spinLoop.stop();
  }, [
    badgeOpacity,
    badgeScale,
    copyOpacity,
    copyTranslate,
    glowOpacity,
    glowScale,
    ringOpacity,
    spin,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), INTRO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!introDone || !isHydrated) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(zoom, {
          toValue: 1.55,
          duration: ZOOM_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: ZOOM_DURATION,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }, 120);

    return () => clearTimeout(timer);
  }, [introDone, isHydrated, opacityAnim, zoom]);

  if (!visible) return null;

  const ringRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[styles.splashOverlay, { opacity: opacityAnim }]}
      pointerEvents="auto"
    >
      <LinearGradient
        colors={["#060D17", "#0B1626", "#052E2B"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.auroraTop} />
      <View style={styles.auroraBottom} />

      <Animated.View
        style={[styles.contentWrapper, { transform: [{ scale: zoom }] }]}
      >
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.halo,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.ring,
              { opacity: ringOpacity, transform: [{ rotate: ringRotate }] },
            ]}
          >
            <View style={styles.ringDash} />
          </Animated.View>

          <Animated.View
            style={{
              opacity: badgeOpacity,
              transform: [{ scale: badgeScale }],
            }}
          >
            <View style={styles.logoFrame}>
              <LinearGradient
                colors={["#0F766E", "#10B981", "#0D9488"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <View style={styles.logoShine} />
                <Ionicons name="wallet" size={44} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: copyOpacity,
            transform: [{ translateY: copyTranslate }],
          }}
        >
          <View style={styles.wordmarkRow}>
            <Text style={styles.appName}>Monevo</Text>
            <View style={styles.wordmarkDot} />
          </View>
          <Text style={styles.appTagline}>PERSONAL FINANCE</Text>
        </Animated.View>
      </Animated.View>
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
  auroraTop: {
    position: "absolute",
    top: -120,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  auroraBottom: {
    position: "absolute",
    bottom: -140,
    left: -110,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(37, 99, 235, 0.10)",
  },
  contentWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  logoStage: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  halo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primary,
  },
  ring: {
    position: "absolute",
    width: 164,
    height: 164,
    alignItems: "center",
    justifyContent: "center",
  },
  ringDash: {
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(45, 212, 191, 0.35)",
  },
  logoFrame: {
    padding: 9,
    borderRadius: 32,
    backgroundColor: "#0A1626",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    ...shadows.lg,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoShine: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  appName: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: "#FFFFFF",
    textAlign: "center",
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 3,
    marginBottom: 9,
  },
  appTagline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 4,
    color: "rgba(204, 251, 241, 0.72)",
    marginTop: 8,
    marginLeft: 4,
    textAlign: "center",
  },
});
