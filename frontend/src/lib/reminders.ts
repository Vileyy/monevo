import type { Ionicons } from "@expo/vector-icons";
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
    color: "#B91C1C",
    bgColor: "#FEF2F2",
  },
  {
    category: "ELECTRICITY",
    label: "Electricity",
    defaultTitle: "Electricity Bill",
    icon: "flash",
    color: "#B45309",
    bgColor: "#FFFBEB",
  },
  {
    category: "WATER",
    label: "Water",
    defaultTitle: "Water Utility",
    icon: "water",
    color: "#0369A1",
    bgColor: "#F0F9FF",
  },
  {
    category: "RENT",
    label: "Rent",
    defaultTitle: "House / Apartment Rent",
    icon: "home",
    color: "#4338CA",
    bgColor: "#EEF2FF",
  },
  {
    category: "INTERNET",
    label: "Internet",
    defaultTitle: "Internet Subscription",
    icon: "wifi",
    color: "#047857",
    bgColor: "#ECFDF5",
  },
  {
    category: "PHONE",
    label: "Mobile Plan",
    defaultTitle: "Mobile Plan / Phone Bill",
    icon: "call",
    color: "#6D28D9",
    bgColor: "#F5F3FF",
  },
  {
    category: "OTHER",
    label: "Other",
    defaultTitle: "Recurring Payment",
    icon: "receipt",
    color: "#0F766E",
    bgColor: "#F0FDFA",
  },
];

export function getReminderCategoryMeta(
  category?: string,
): ReminderCategoryMeta {
  const found = REMINDER_PRESETS.find((p) => p.category === category);
  return found || REMINDER_PRESETS[REMINDER_PRESETS.length - 1];
}
