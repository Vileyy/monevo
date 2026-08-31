import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";

export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    // Complete callback and navigate into the app
    const timer = setTimeout(() => {
      router.replace("/");
    }, 300);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
