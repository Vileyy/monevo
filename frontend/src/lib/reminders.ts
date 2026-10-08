import { Ionicons } from "@expo/vector-icons";
import { ReminderCategory } from "@/store/reminder.store";

export interface ReminderCategoryMeta {
  category: ReminderCategory;
  label: string;
  defaultTitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

export const REMINDER_PRESETS: ReminderCategoryMeta[] = [
  {
    category: "MEDICINE",
    label: "Medicine",
    defaultTitle: "Prescription Medicine",
    icon: "medkit",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  {
    category: "ELECTRICITY",
    label: "Electricity",
    defaultTitle: "Electricity Bill",
    icon: "flash",
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  {
    category: "WATER",
    label: "Water",
    defaultTitle: "Water Utility",
    icon: "water",
    color: "#0284C7",
    bgColor: "#E0F2FE",
  },
  {
    category: "RENT",
    label: "Rent",
    defaultTitle: "House / Apartment Rent",
    icon: "home",
    color: "#4F46E5",
    bgColor: "#EEF2FF",
  },
  {
    category: "INTERNET",
    label: "Internet",
    defaultTitle: "Internet Subscription",
    icon: "wifi",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  {
    category: "PHONE",
    label: "Mobile Plan",
    defaultTitle: "Mobile Plan / Phone Bill",
    icon: "call",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  {
    category: "OTHER",
    label: "Other",
    defaultTitle: "Recurring Payment",
    icon: "receipt",
    color: "#0D9488",
    bgColor: "#E6F7F5",
  },
];

export function getReminderCategoryMeta(
  category?: string,
): ReminderCategoryMeta {
  const found = REMINDER_PRESETS.find((p) => p.category === category);
  return found || REMINDER_PRESETS[REMINDER_PRESETS.length - 1];
}
