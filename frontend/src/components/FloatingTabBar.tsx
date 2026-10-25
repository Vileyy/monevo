import React, { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, spacing, typography } from "@/theme";

const BAR_HEIGHT = 62;

/** Space covered by the floating bar, so scroll content can clear it. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + spacing.xl + Math.max(insets.bottom, spacing.sm);
}

interface TabBarRoute {
  key: string;
  name: string;
  params?: object;
}

interface TabBarOptions {
  title?: string;
  tabBarIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => ReactNode;
}

export interface FloatingTabBarProps {
  state: {
    index: number;
    routes: TabBarRoute[];
  };
  descriptors: Record<string, { options: TabBarOptions }>;
  navigation: {
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
  insets: { bottom: number };
}

const CENTER_ROUTE = "explore";

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: FloatingTabBarProps) {
  const centerIndex = state.routes.findIndex(
    (route) => route.name === CENTER_ROUTE,
  );

  const handlePress = (route: TabBarRoute, focused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const renderIcon = (
    options: TabBarOptions,
    focused: boolean,
    color: string,
    size: number,
  ) => options.tabBarIcon?.({ focused, color, size }) ?? null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options ?? {};
          const focused = state.index === index;
          const isCenter = index === centerIndex;
          const label = options.title ?? route.name;
          const color = focused ? colors.primary : colors.textMuted;

          if (isCenter) {
            return <View key={route.key} style={styles.centerSlot} />;
          }

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route, focused)}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={styles.iconWrap}>
                {renderIcon(options, focused, color, 22)}
              </View>
              <Text
                style={[styles.label, { color }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {centerIndex >= 0 && (
        <View style={styles.centerLayer}>
          <Pressable
            onPress={() =>
              handlePress(
                state.routes[centerIndex],
                state.index === centerIndex,
              )
            }
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityState={{ selected: state.index === centerIndex }}
            accessibilityLabel={
              descriptors[state.routes[centerIndex].key]?.options?.title ??
              "Insights"
            }
            style={({ pressed }) => [
              styles.centerButton,
              state.index === centerIndex && styles.centerButtonFocused,
              pressed && styles.centerButtonPressed,
            ]}
          >
            {renderIcon(
              descriptors[state.routes[centerIndex].key]?.options ?? {},
              true,
              colors.textInverse,
              24,
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: BAR_HEIGHT,
    borderRadius: 31,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.xs,
    ...shadows.md,
  },
  item: {
    flex: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
  centerSlot: {
    flex: 1,
    height: 62,
  },
  centerLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 4,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  centerButtonFocused: {
    backgroundColor: colors.primaryDark,
  },
  centerButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.95,
  },
});
