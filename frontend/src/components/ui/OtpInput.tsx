import React, { useEffect } from "react";
import { LayoutChangeEvent, Platform, StyleSheet, Text } from "react-native";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "@/theme";
import { hapticFeedback } from "@/lib/haptics";

export interface OtpInputProps {
  code: string;
  length?: number;
  onCodeChange: (code: string) => void;
  onFilled?: (code: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

interface OtpCellProps {
  index: number;
  symbol: string;
  isFocused: boolean;
  hasError: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
}

function OtpCell({
  index,
  symbol,
  isFocused,
  hasError,
  onLayout,
}: OtpCellProps) {
  const isFilled = Boolean(symbol);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.cell,
        isFilled && styles.cellFilled,
        isFocused && styles.cellFocused,
        hasError && styles.cellError,
      ]}
    >
      {symbol ? (
        <Animated.View
          key={`${index}-${symbol}`}
          entering={FadeIn.duration(120)}
          style={styles.symbolContainer}
        >
          <Text style={[styles.cellText, hasError && styles.cellTextError]}>
            {symbol}
          </Text>
        </Animated.View>
      ) : isFocused ? (
        <Text style={styles.cursorText}>
          <Cursor cursorSymbol="|" />
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function OtpInput({
  code,
  length = 6,
  onCodeChange,
  onFilled,
  hasError = false,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const ref = useBlurOnFulfill({ value: code, cellCount: length });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: onCodeChange,
  });

  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (hasError) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [hasError, shakeX]);

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleTextChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, length);
    hapticFeedback.selection();
    onCodeChange(clean);

    if (clean.length === length && onFilled) {
      onFilled(clean);
    }
  };

  return (
    <Animated.View style={[styles.container, shakeAnimatedStyle]}>
      <CodeField
        ref={ref}
        {...props}
        value={code}
        onChangeText={handleTextChange}
        cellCount={length}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        autoFocus={autoFocus}
        editable={!disabled}
        testID="otp-code-field"
        renderCell={({ index, symbol, isFocused }) => (
          <OtpCell
            key={index}
            index={index}
            symbol={symbol}
            isFocused={isFocused}
            hasError={hasError}
            onLayout={getCellOnLayoutHandler(index)}
          />
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
    width: "100%",
  },
  codeFieldRoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  cellFocused: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
  },
  cellFilled: {
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },
  cellError: {
    borderColor: colors.danger,
    backgroundColor: "#FEF2F2",
  },
  symbolContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  cellTextError: {
    color: colors.danger,
  },
  cursorText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "300",
    color: colors.primary,
    textAlign: "center",
  },
});
