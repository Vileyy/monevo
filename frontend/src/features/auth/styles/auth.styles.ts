import { StyleSheet } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: colors.text,
  },
  appTagline: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  methodSwitcher: {
    marginBottom: spacing.md,
  },
  modeSwitcher: {
    marginBottom: spacing.base,
  },
  cardHeader: {
    marginBottom: spacing.base,
  },
  title: {
    ...typography.title2,
    color: colors.text,
    fontWeight: "800",
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 2,
  },
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    textTransform: "uppercase",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  googleButtonContainer: {
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 4,
  },
  otpInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  otpInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  otpEmailText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: 1,
  },
  editEmailBtn: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  countdownText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resendText: {
    ...typography.subhead,
    fontWeight: "700",
    color: colors.primary,
  },
});
