export const BIOMETRIC_FINGERPRINT = 1;
export const BIOMETRIC_FACIAL_RECOGNITION = 2;
export const BIOMETRIC_IRIS = 3;

export type BiometricIconName =
  "scan-outline" | "finger-print-outline" | "lock-closed-outline";

export function resolveBiometricLabel(
  platform: string,
  supportedTypes: number[],
): string {
  if (platform === "ios") {
    if (supportedTypes.includes(BIOMETRIC_FACIAL_RECOGNITION)) return "Face ID";
    if (supportedTypes.includes(BIOMETRIC_FINGERPRINT)) return "Touch ID";
    return "Biometrics";
  }

  if (supportedTypes.includes(BIOMETRIC_FINGERPRINT)) return "Fingerprint";
  if (supportedTypes.includes(BIOMETRIC_FACIAL_RECOGNITION))
    return "Face Unlock";
  return "Biometrics";
}

export function resolveBiometricIcon(
  platform: string,
  supportedTypes: number[],
): BiometricIconName {
  if (platform === "ios") {
    return supportedTypes.includes(BIOMETRIC_FACIAL_RECOGNITION)
      ? "scan-outline"
      : supportedTypes.includes(BIOMETRIC_FINGERPRINT)
        ? "finger-print-outline"
        : "lock-closed-outline";
  }

  if (supportedTypes.includes(BIOMETRIC_FINGERPRINT)) {
    return "finger-print-outline";
  }
  if (supportedTypes.includes(BIOMETRIC_FACIAL_RECOGNITION)) {
    return "scan-outline";
  }
  return "lock-closed-outline";
}
