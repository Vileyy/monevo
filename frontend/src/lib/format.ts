import currency from "currency.js";

const vnd = (value: currency.Any) =>
  currency(value, {
    symbol: "₫",
    pattern: "# !",
    negativePattern: "-# !",
    separator: ".",
    decimal: ",",
    precision: 0,
  });

export function formatCurrency(val: number) {
  return vnd(val).format();
}

export function parseVndInput(text: string) {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return vnd(digits).value;
}

export function formatVndInput(text: string) {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return "";
  return vnd(digits).format({ symbol: "" }).trim();
}

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
