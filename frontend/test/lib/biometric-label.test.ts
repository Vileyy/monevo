import {
  BIOMETRIC_FACIAL_RECOGNITION,
  BIOMETRIC_FINGERPRINT,
  resolveBiometricIcon,
  resolveBiometricLabel,
} from "../../src/lib/biometric-label";

describe("Biometric label resolution", () => {
  it("labels Face ID and Touch ID on iOS", () => {
    expect(resolveBiometricLabel("ios", [BIOMETRIC_FACIAL_RECOGNITION])).toBe(
      "Face ID",
    );
    expect(resolveBiometricLabel("ios", [BIOMETRIC_FINGERPRINT])).toBe(
      "Touch ID",
    );
  });

  it("labels fingerprint and face unlock on Android", () => {
    expect(resolveBiometricLabel("android", [BIOMETRIC_FINGERPRINT])).toBe(
      "Fingerprint",
    );
    expect(resolveBiometricLabel("android", [BIOMETRIC_FACIAL_RECOGNITION])).toBe(
      "Face Unlock",
    );
  });

  it("falls back when no biometric type is reported", () => {
    expect(resolveBiometricLabel("ios", [])).toBe("Biometrics");
    expect(resolveBiometricLabel("android", [])).toBe("Biometrics");
  });

  it("picks matching icons", () => {
    expect(resolveBiometricIcon("ios", [BIOMETRIC_FACIAL_RECOGNITION])).toBe(
      "scan-outline",
    );
    expect(resolveBiometricIcon("ios", [BIOMETRIC_FINGERPRINT])).toBe(
      "finger-print-outline",
    );
    expect(resolveBiometricIcon("android", [BIOMETRIC_FINGERPRINT])).toBe(
      "finger-print-outline",
    );
    expect(resolveBiometricIcon("android", [])).toBe("lock-closed-outline");
  });
});
