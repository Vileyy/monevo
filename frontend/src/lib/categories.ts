import { Ionicons } from "@expo/vector-icons";

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
  Food: { icon: "restaurant-outline", color: "#EA580C", bgColor: "#FFEDD5" },
  "Ăn uống": {
    icon: "restaurant-outline",
    color: "#EA580C",
    bgColor: "#FFEDD5",
  },
  Transport: { icon: "car-outline", color: "#2563EB", bgColor: "#DBEAFE" },
  "Di chuyển": { icon: "car-outline", color: "#2563EB", bgColor: "#DBEAFE" },
  Shopping: {
    icon: "bag-handle-outline",
    color: "#DB2777",
    bgColor: "#FCE7F3",
  },
  "Mua sắm": {
    icon: "bag-handle-outline",
    color: "#DB2777",
    bgColor: "#FCE7F3",
  },
  Bills: { icon: "receipt-outline", color: "#CA8A04", bgColor: "#FEF08A" },
  "Hóa đơn": { icon: "receipt-outline", color: "#CA8A04", bgColor: "#FEF08A" },
  Entertainment: { icon: "film-outline", color: "#7C3AED", bgColor: "#EDE9FE" },
  "Giải trí": { icon: "film-outline", color: "#7C3AED", bgColor: "#EDE9FE" },
  Health: { icon: "medkit-outline", color: "#DC2626", bgColor: "#FEE2E2" },
  "Y tế": { icon: "medkit-outline", color: "#DC2626", bgColor: "#FEE2E2" },
  Education: { icon: "school-outline", color: "#0284C7", bgColor: "#E0F2FE" },
  "Giáo dục": { icon: "school-outline", color: "#0284C7", bgColor: "#E0F2FE" },
  Salary: { icon: "cash-outline", color: "#059669", bgColor: "#D1FAE5" },
  Lương: { icon: "cash-outline", color: "#059669", bgColor: "#D1FAE5" },
  Bonus: { icon: "gift-outline", color: "#0D9488", bgColor: "#CCFBF1" },
  Thưởng: { icon: "gift-outline", color: "#0D9488", bgColor: "#CCFBF1" },
  Investment: {
    icon: "trending-up-outline",
    color: "#0891B2",
    bgColor: "#CFFAFE",
  },
  "Đầu tư": {
    icon: "trending-up-outline",
    color: "#0891B2",
    bgColor: "#CFFAFE",
  },
  "Other income": {
    icon: "wallet-outline",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  "Thu khác": { icon: "wallet-outline", color: "#059669", bgColor: "#D1FAE5" },
  Other: {
    icon: "ellipsis-horizontal-outline",
    color: "#475569",
    bgColor: "#E2E8F0",
  },
  Khác: {
    icon: "ellipsis-horizontal-outline",
    color: "#475569",
    bgColor: "#E2E8F0",
  },
};

export const DEFAULT_CATEGORY_METAS: CategoryMeta[] = [
  {
    name: "Food",
    icon: "restaurant-outline",
    color: "#EA580C",
    bgColor: "#FFEDD5",
    type: "EXPENSE",
  },
  {
    name: "Transport",
    icon: "car-outline",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    type: "EXPENSE",
  },
  {
    name: "Shopping",
    icon: "bag-handle-outline",
    color: "#DB2777",
    bgColor: "#FCE7F3",
    type: "EXPENSE",
  },
  {
    name: "Bills",
    icon: "receipt-outline",
    color: "#CA8A04",
    bgColor: "#FEF08A",
    type: "EXPENSE",
  },
  {
    name: "Entertainment",
    icon: "film-outline",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    type: "EXPENSE",
  },
  {
    name: "Health",
    icon: "medkit-outline",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    type: "EXPENSE",
  },
  {
    name: "Salary",
    icon: "cash-outline",
    color: "#059669",
    bgColor: "#D1FAE5",
    type: "INCOME",
  },
  {
    name: "Bonus",
    icon: "gift-outline",
    color: "#0D9488",
    bgColor: "#CCFBF1",
    type: "INCOME",
  },
  {
    name: "Investment",
    icon: "trending-up-outline",
    color: "#0891B2",
    bgColor: "#CFFAFE",
    type: "INCOME",
  },
  {
    name: "Other income",
    icon: "wallet-outline",
    color: "#059669",
    bgColor: "#D1FAE5",
    type: "INCOME",
  },
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
      ? { icon: "cash-outline", color: "#059669", bgColor: "#D1FAE5" }
      : { icon: "cart-outline", color: "#475569", bgColor: "#E2E8F0" };
  }

  const match = CATEGORY_PRESETS[name];
  if (match) return match;

  return type === "INCOME"
    ? {
        icon: "arrow-down-circle-outline",
        color: "#059669",
        bgColor: "#D1FAE5",
      }
    : { icon: "pricetag-outline", color: "#EA580C", bgColor: "#FFEDD5" };
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
        icon: "business-outline",
        label: "Bank Account",
        gradient: ["#1E40AF", "#3B82F6"],
        color: "#2563EB",
        bgColor: "#DBEAFE",
      };
    case "CREDIT_CARD":
      return {
        icon: "card-outline",
        label: "Credit Card",
        gradient: ["#5B21B6", "#7C3AED"],
        color: "#7C3AED",
        bgColor: "#EDE9FE",
      };
    case "CASH":
    default:
      return {
        icon: "cash-outline",
        label: "Cash Wallet",
        gradient: ["#047857", "#10B981"],
        color: "#059669",
        bgColor: "#D1FAE5",
      };
  }
}
