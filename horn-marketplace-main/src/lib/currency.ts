export const SLSH_PER_USD = 8500;
export type Currency = "USD" | "SLSH";

export const usdToSlsh = (usd: number) => Math.round(usd * SLSH_PER_USD);
export const slshToUsd = (slsh: number) => Math.round((slsh / SLSH_PER_USD) * 100) / 100;

export function formatPrice(usd: number, currency: Currency) {
  if (currency === "USD") return `$${usd.toFixed(2)}`;
  return `${usdToSlsh(usd).toLocaleString("en-US")} SLSh`;
}

export const CITIES = ["Hargeisa", "Berbera", "Burao", "Tog Wajaale"] as const;
export const CATEGORIES = ["Groceries", "Electronics", "Clothing", "Home", "Livestock", "Other"] as const;
export const PAYMENT_METHODS = ["Zaad", "eDahab", "Sahal"] as const;
