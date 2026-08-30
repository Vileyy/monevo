export const colors = {
  // Brand & Accent
  primary: "#0D9488",
  primaryDark: "#0F766E",
  primaryLight: "#CCFBF1",
  primaryMuted: "#E6F7F5",
  accent: "#10B981",

  // Background & Surfaces
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",
  surfaceMuted: "#F8FAFC",
  surfaceDark: "#0F172A",

  // Typography
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Transaction States
  income: "#10B981",
  incomeBg: "#ECFDF5",
  incomeBorder: "#A7F3D0",
  expense: "#F43F5E",
  expenseBg: "#FFF1F2",
  expenseBorder: "#FECDD3",

  // Alerts & System
  success: "#10B981",
  danger: "#F43F5E",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  info: "#3B82F6",
  infoBg: "#EFF6FF",

  // Borders & Dividers
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderFocus: "#0D9488",
  overlay: "rgba(15, 23, 42, 0.05)",
  backdrop: "rgba(15, 23, 42, 0.5)",

  // Account Card Gradients & Colors
  cardCash: "#059669",
  cardBank: "#2563EB",
  cardCredit: "#7C3AED",
  cardSavings: "#D97706",
} as const;

export type ColorsType = typeof colors;
