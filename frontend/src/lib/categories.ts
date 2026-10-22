import type { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export interface CategoryMeta {
  name: string;
  icon: IconName;
  color: string;
  bgColor: string;
  type: "EXPENSE" | "INCOME";
}

export const CATEGORY_PRESETS: Record<
  string,
  { icon: IconName; color: string; bgColor: string }
> = {
  Food: { icon: "restaurant", color: "#C2410C", bgColor: "#FFF7ED" },
  "Ăn uống": { icon: "restaurant", color: "#C2410C", bgColor: "#FFF7ED" },
  Transport: { icon: "car", color: "#1D4ED8", bgColor: "#EFF6FF" },
  "Di chuyển": { icon: "car", color: "#1D4ED8", bgColor: "#EFF6FF" },
  Shopping: { icon: "bag-handle", color: "#BE185D", bgColor: "#FDF2F8" },
  "Mua sắm": { icon: "bag-handle", color: "#BE185D", bgColor: "#FDF2F8" },
  Bills: { icon: "receipt", color: "#A16207", bgColor: "#FEFCE8" },
  "Hóa đơn": { icon: "receipt", color: "#A16207", bgColor: "#FEFCE8" },
  Entertainment: { icon: "film", color: "#6D28D9", bgColor: "#F5F3FF" },
  "Giải trí": { icon: "film", color: "#6D28D9", bgColor: "#F5F3FF" },
  Health: { icon: "medkit", color: "#B91C1C", bgColor: "#FEF2F2" },
  "Y tế": { icon: "medkit", color: "#B91C1C", bgColor: "#FEF2F2" },
  Education: { icon: "school", color: "#0369A1", bgColor: "#F0F9FF" },
  "Giáo dục": { icon: "school", color: "#0369A1", bgColor: "#F0F9FF" },
  Salary: { icon: "cash", color: "#047857", bgColor: "#ECFDF5" },
  Lương: { icon: "cash", color: "#047857", bgColor: "#ECFDF5" },
  Bonus: { icon: "gift", color: "#0F766E", bgColor: "#F0FDFA" },
  Thưởng: { icon: "gift", color: "#0F766E", bgColor: "#F0FDFA" },
  Investment: { icon: "trending-up", color: "#0E7490", bgColor: "#ECFEFF" },
  "Đầu tư": { icon: "trending-up", color: "#0E7490", bgColor: "#ECFEFF" },
  "Other income": { icon: "wallet", color: "#047857", bgColor: "#ECFDF5" },
  "Thu khác": { icon: "wallet", color: "#047857", bgColor: "#ECFDF5" },
  Other: {
    icon: "ellipsis-horizontal",
    color: "#475569",
    bgColor: "#F1F5F9",
  },
  Khác: {
    icon: "ellipsis-horizontal",
    color: "#475569",
    bgColor: "#F1F5F9",
  },
};

function defaultMeta(name: string, type: "EXPENSE" | "INCOME"): CategoryMeta {
  return { name, type, ...CATEGORY_PRESETS[name] };
}

export const DEFAULT_CATEGORY_METAS: CategoryMeta[] = [
  defaultMeta("Food", "EXPENSE"),
  defaultMeta("Transport", "EXPENSE"),
  defaultMeta("Shopping", "EXPENSE"),
  defaultMeta("Bills", "EXPENSE"),
  defaultMeta("Entertainment", "EXPENSE"),
  defaultMeta("Health", "EXPENSE"),
  defaultMeta("Salary", "INCOME"),
  defaultMeta("Bonus", "INCOME"),
  defaultMeta("Investment", "INCOME"),
  defaultMeta("Other income", "INCOME"),
];

export function getCategoryMeta(
  name?: string | null,
  type: "EXPENSE" | "INCOME" = "EXPENSE",
): {
  icon: IconName;
  color: string;
  bgColor: string;
} {
  if (!name) {
    return type === "INCOME"
      ? { icon: "cash", color: "#047857", bgColor: "#ECFDF5" }
      : { icon: "cart", color: "#475569", bgColor: "#F1F5F9" };
  }

  const match = CATEGORY_PRESETS[name];
  if (match) return match;

  return type === "INCOME"
    ? { icon: "arrow-down-circle", color: "#047857", bgColor: "#ECFDF5" }
    : { icon: "pricetag", color: "#C2410C", bgColor: "#FFF7ED" };
}

export function getWalletMeta(type: string): {
  icon: IconName;
  label: string;
  gradient: [string, string];
  color: string;
  bgColor: string;
} {
  switch (type) {
    case "BANK":
      return {
        icon: "business",
        label: "Bank Account",
        gradient: ["#1E40AF", "#3B82F6"],
        color: "#1D4ED8",
        bgColor: "#EFF6FF",
      };
    case "CREDIT_CARD":
      return {
        icon: "card",
        label: "Credit Card",
        gradient: ["#5B21B6", "#7C3AED"],
        color: "#6D28D9",
        bgColor: "#F5F3FF",
      };
    case "CASH":
    default:
      return {
        icon: "cash",
        label: "Cash Wallet",
        gradient: ["#047857", "#10B981"],
        color: "#047857",
        bgColor: "#ECFDF5",
      };
  }
}
