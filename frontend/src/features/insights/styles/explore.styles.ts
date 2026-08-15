import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    color: colors.text,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 6,
  },
  scrollContainer: {
    paddingBottom: 48,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: colors.overlay,
    borderRadius: 3,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  emptyHint: {
    marginHorizontal: spacing.lg,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyHintText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
