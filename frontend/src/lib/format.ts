import currency from "currency.js";
import {
  CurrencyCode,
  CurrencyConfig,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
} from "./currencies";
import {
  convertFromBase,
  convertToBase,
  roundToPrecision,
} from "./currency-conversion";
import { useSettingsStore } from "@/store/settings.store";
import { useCurrencyStore } from "@/store/currency.store";

function displayCode(): CurrencyCode {
  return useSettingsStore.getState?.()?.currency || DEFAULT_CURRENCY;
}

function formatWithConfig(val: number, config: CurrencyConfig) {
  return currency(val, {
    symbol: config.symbol,
    pattern: config.pattern,
    negativePattern: config.negativePattern,
    separator: config.separator,
    decimal: config.decimal,
    precision: config.precision,
  }).format();
}

/**
 * Formats a stored (VND) amount in the user's display currency.
 * Passing `customCode` formats the value as-is, without conversion.
 */
export function formatCurrency(val: number, customCode?: CurrencyCode) {
  const code = customCode || displayCode();
  const config = getCurrencyConfig(code);

  if (customCode) return formatWithConfig(val, config);

  const converted = convertFromBase(
    val,
    code,
    useCurrencyStore.getState?.()?.rates ?? {},
  );
  // No rate yet: show the base amount instead of a wrong converted number.
  if (converted === null) {
    return formatWithConfig(val, getCurrencyConfig(DEFAULT_CURRENCY));
  }
  return formatWithConfig(converted, config);
}

/** Parses text typed in the display currency. No conversion. */
export function parseCurrencyInput(text: string, customCode?: CurrencyCode) {
  const code = customCode || displayCode();
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

/** Formats a display-currency amount for a text input. No conversion. */
export function formatCurrencyInput(text: string, customCode?: CurrencyCode) {
  const code = customCode || displayCode();
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

/** Parses an amount typed in the display currency back into stored VND. */
export function parseVndInput(text: string): number {
  const code = displayCode();
  const displayAmount = parseCurrencyInput(text, code);
  if (displayAmount <= 0) return 0;

  const base = convertToBase(
    displayAmount,
    code,
    useCurrencyStore.getState?.()?.rates ?? {},
  );
  return base === null ? displayAmount : roundToPrecision(base, 2);
}

/**
 * Prefills an input from a stored (VND) amount, converted to display currency.
 */
export function formatAmountInput(
  baseAmount: number,
  customCode?: CurrencyCode,
) {
  const code = customCode || displayCode();
  const config = getCurrencyConfig(code);
  const displayAmount = customCode
    ? baseAmount
    : (convertFromBase(
        baseAmount,
        code,
        useCurrencyStore.getState?.()?.rates ?? {},
      ) ?? baseAmount);

  return formatCurrencyInput(
    roundToPrecision(displayAmount, config.precision).toString(),
    code,
  );
}

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
