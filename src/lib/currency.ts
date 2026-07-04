export interface CurrencyConfig {
  symbol: string;
  rate: number;
  code: string;
  label: string;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  "INR": { symbol: "₹", rate: 1, code: "INR", label: "INR (₹)" },
  "USD": { symbol: "$", rate: 1 / 83.0, code: "USD", label: "USD ($)" },
  "EUR": { symbol: "€", rate: 1 / 90.0, code: "EUR", label: "EUR (€)" },
  "GBP": { symbol: "£", rate: 1 / 105.0, code: "GBP", label: "GBP (£)" }
};

export function getCurrencyConfig(): CurrencyConfig {
  const saved = localStorage.getItem("planzo_currency") || "INR (₹)";
  
  // Extract currency code from string (e.g. "USD ($)" -> "USD")
  const code = Object.keys(CURRENCY_CONFIGS).find(c => saved.includes(c)) || "INR";
  return CURRENCY_CONFIGS[code];
}

export function formatPrice(amountINR: number): string {
  const { symbol, rate } = getCurrencyConfig();
  const converted = Math.round(amountINR * rate);
  return `${symbol}${converted.toLocaleString()}`;
}

export function parsePriceToINR(priceStr: string | number): number {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  // Strip non-numeric characters (except digits)
  const normalized = priceStr.replace(/[^0-9]/g, "");
  return parseInt(normalized, 10) || 0;
}
