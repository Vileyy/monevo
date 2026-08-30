import currency from "currency.js";
import {
  CurrencyCode,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
} from "./currencies";
import { useSettingsStore } from "@/store/settings.store";

export function formatCurrency(val: number, customCode?: CurrencyCode) {
  const code =
    customCode || useSettingsStore.getState?.()?.currency || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(code);

  return currency(val, {
    symbol: config.symbol,
    pattern: config.pattern,
    negativePattern: config.negativePattern,
    separator: config.separator,
    decimal: config.decimal,
    precision: config.precision,
  }).format();
}

export function parseCurrencyInput(text: string, customCode?: CurrencyCode) {
  const code =
    customCode || useSettingsStore.getState?.()?.currency || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(code);

  if (config.precision === 0) {
    const digits = text.replace(/[^\d]/g, "");
    if (!digits) return 0;
    return parseInt(digits, 10);
  }

  const clean = text.replace(/[^\d.]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatCurrencyInput(text: string, customCode?: CurrencyCode) {
  const code =
    customCode || useSettingsStore.getState?.()?.currency || DEFAULT_CURRENCY;
  const config = getCurrencyConfig(code);

  if (config.precision === 0) {
    const digits = text.replace(/[^\d]/g, "");
    if (!digits) return "";
    return currency(digits, {
      symbol: "",
      separator: config.separator,
      decimal: config.decimal,
      precision: 0,
    })
      .format()
      .trim();
  }

  return text.replace(/[^\d.]/g, "");
}

export const parseVndInput = parseCurrencyInput;
export const formatVndInput = formatCurrencyInput;

export function walletTypeLabel(type: string) {
  switch (type) {
    case "CASH":
      return "Cash";
    case "BANK":
      return "Bank";
    case "CREDIT_CARD":
      return "Card";
    default:
      return type;
  }
}

const CATEGORY_NAME_EN: Record<string, string> = {
  "Ăn uống": "Food",
  "Di chuyển": "Transport",
  "Mua sắm": "Shopping",
  "Hóa đơn": "Bills",
  Lương: "Salary",
  "Thu khác": "Other income",
  Khác: "Other",
};

export function categoryDisplayName(name: string) {
  return CATEGORY_NAME_EN[name] ?? name;
}
