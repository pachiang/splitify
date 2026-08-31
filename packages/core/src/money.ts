import { getCurrency } from "@splitify/shared";

export interface FormatMoneyOptions {
  withSymbol?: boolean;
  withGrouping?: boolean;
}

/**
 * 把「最小單位整數」金額格式化成顯示字串。
 *   formatMoney(123456, "TWD") → "NT$123,456"
 *   formatMoney(1234, "USD")   → "$12.34"
 */
export function formatMoney(
  minor: number,
  currency: string,
  options: FormatMoneyOptions = {},
): string {
  const { withSymbol = true, withGrouping = true } = options;
  const meta = getCurrency(currency);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const divisor = 10 ** meta.exponent;
  const whole = Math.trunc(abs / divisor);
  const frac = abs - whole * divisor;

  let wholeStr = String(whole);
  if (withGrouping) {
    wholeStr = wholeStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let out = wholeStr;
  if (meta.exponent > 0) {
    out += `.${String(frac).padStart(meta.exponent, "0")}`;
  }
  if (withSymbol) {
    out = meta.symbol + out;
  }
  return negative ? `-${out}` : out;
}

/** 顯示用主單位數字 → 最小單位整數。toMinor(12.34, "USD") → 1234 */
export function toMinor(major: number, currency: string): number {
  const meta = getCurrency(currency);
  return Math.round(major * 10 ** meta.exponent);
}

/** 最小單位整數 → 主單位數字 (僅供顯示/匯出;內部運算請維持整數)。 */
export function fromMinor(minor: number, currency: string): number {
  const meta = getCurrency(currency);
  return minor / 10 ** meta.exponent;
}
