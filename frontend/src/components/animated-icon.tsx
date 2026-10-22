import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
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
          toValue: 1.35,
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
            style={[
              styles.logoFrame,
              {
                opacity: badgeOpacity,
                transform: [{ scale: badgeScale }],
              },
            ]}
          >
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
    backgroundColor: colors.surface,
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
    backgroundColor: "rgba(13, 148, 136, 0.06)",
  },
  auroraBottom: {
    position: "absolute",
    bottom: -140,
    left: -110,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
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
    backgroundColor: colors.primaryLight,
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
    borderColor: "rgba(13, 148, 136, 0.28)",
  },
  logoFrame: {
    ...shadows.lg,
  },
  logoImage: {
    width: 132,
    height: 132,
    borderRadius: 32,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  appName: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: colors.text,
    textAlign: "center",
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 3,
    marginBottom: 9,
  },
  appTagline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 4,
    color: colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
    textAlign: "center",
  },
});
