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
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.text,
  },
  appTagline: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  authTabSwitcher: {
    marginBottom: spacing.base,
  },
  cardHeader: {
    marginBottom: spacing.base,
  },
  title: {
    ...typography.title2,
    color: colors.text,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 2,
  },
  googleButtonContainer: {
    marginBottom: spacing.base,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
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
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: spacing.sm,
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
});
