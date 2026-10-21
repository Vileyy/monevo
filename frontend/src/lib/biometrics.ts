import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  BiometricIconName,
  resolveBiometricIcon,
  resolveBiometricLabel,
} from "./biometric-label";

const BIOMETRIC_ENABLED_KEY = "monevo_biometric_enabled";

export interface BiometricCapability {
  available: boolean;
  label: string;
  icon: BiometricIconName;
}

const UNAVAILABLE: BiometricCapability = {
  available: false,
  label: "Biometrics",
  icon: "lock-closed-outline",
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === "web") return UNAVAILABLE;

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return UNAVAILABLE;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const numericTypes = types.map((type) => Number(type));

    return {
      available: hasHardware,
      label: isEnrolled
        ? resolveBiometricLabel(Platform.OS, numericTypes)
        : Platform.OS === "ios"
          ? "Face ID"
          : "Biometrics",
      icon: isEnrolled
        ? resolveBiometricIcon(Platform.OS, numericTypes)
        : Platform.OS === "ios"
          ? "scan-outline"
          : "finger-print-outline",
    };
  } catch {
    return UNAVAILABLE;
  }
}

export async function isBiometricEnrolled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "1");
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    }
  } catch {}
}
