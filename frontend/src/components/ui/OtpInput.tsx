import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

export function OtpInput({
  code,
  length = 6,
  onCodeChange,
  onFilled,
  hasError = false,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChangeText = (text: string) => {
    const sanitized = text.replace(/\D/g, "").slice(0, length);
    hapticFeedback.selection();
    onCodeChange(sanitized);

    if (sanitized.length === length && onFilled) {
      onFilled(sanitized);
    }
  };

  const handleCellPress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const cells = Array.from({ length }, (_, i) => {
    const digit = code[i] || "";
    const isCurrent = i === code.length && !disabled;
    const isFilled = Boolean(digit);

    return (
      <View
        key={i}
        style={[
          styles.cell,
          isFilled && styles.cellFilled,
          isCurrent && styles.cellActive,
          hasError && styles.cellError,
        ]}
      >
        <Text
          style={[
            styles.cellText,
            isFilled && styles.cellTextFilled,
            hasError && styles.cellTextError,
          ]}
        >
          {digit}
        </Text>
        {isCurrent && <View style={styles.cursor} />}
      </View>
    );
  });

  return (
    <Pressable
      onPress={handleCellPress}
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel="Nhập mã xác nhận 6 chữ số"
    >
      <View style={styles.cellsContainer}>{cells}</View>

      {/* Hidden Native TextInput */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={!disabled}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  cellsContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cell: {
    width: 46,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    transform: [{ scale: 1.05 }],
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cellError: {
    borderColor: colors.danger,
    backgroundColor: colors.expenseBg,
  },
  cellText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  cellTextFilled: {
    color: colors.primaryDark,
  },
  cellTextError: {
    color: colors.danger,
  },
  cursor: {
    position: "absolute",
    bottom: 12,
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
});
