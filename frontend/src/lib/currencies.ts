export type CurrencyCode =
  "VND" | "USD" | "EUR" | "GBP" | "JPY" | "KRW" | "AUD" | "SGD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  pattern: string;
  negativePattern: string;
  separator: string;
  decimal: string;
  precision: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: "VND",
    symbol: "₫",
    name: "Vietnamese Đồng",
    flag: "🇻🇳",
    pattern: "# !",
    negativePattern: "-# !",
    separator: ".",
    decimal: ",",
    precision: 0,
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 2,
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flag: "🇪🇺",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ".",
    decimal: ",",
    precision: 2,
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    flag: "🇬🇧",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 2,
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    flag: "🇯🇵",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 0,
  },
  {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    flag: "🇰🇷",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 0,
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    flag: "🇦🇺",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 2,
  },
  {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    flag: "🇸🇬",
    pattern: "!#",
    negativePattern: "-!#",
    separator: ",",
    decimal: ".",
    precision: 2,
  },
];

export const DEFAULT_CURRENCY: CurrencyCode = "VND";

export function getCurrencyConfig(code?: string): CurrencyConfig {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return found || SUPPORTED_CURRENCIES[0];
}
