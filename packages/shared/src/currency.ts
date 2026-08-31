/**
 * 幣別中繼資料 (單一真相)。
 *
 * `exponent` = 該幣別最小單位的小數位數:
 *   - TWD/JPY/KRW → 0 (最小單位就是 1 元/圓)
 *   - USD/EUR...   → 2 (最小單位是「分」)
 *
 * 金額在系統中一律以「最小單位的整數 (minor units)」儲存與運算,
 * 顯示時才由 @splitify/core 的格式化函式依 exponent 轉回。
 */
export interface CurrencyMeta {
  code: string;
  exponent: number;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyMeta> = {
  TWD: { code: "TWD", exponent: 0, symbol: "NT$", name: "新台幣" },
  JPY: { code: "JPY", exponent: 0, symbol: "¥", name: "日圓" },
  KRW: { code: "KRW", exponent: 0, symbol: "₩", name: "韓圜" },
  USD: { code: "USD", exponent: 2, symbol: "$", name: "美元" },
  EUR: { code: "EUR", exponent: 2, symbol: "€", name: "歐元" },
  CNY: { code: "CNY", exponent: 2, symbol: "¥", name: "人民幣" },
  HKD: { code: "HKD", exponent: 2, symbol: "HK$", name: "港幣" },
  GBP: { code: "GBP", exponent: 2, symbol: "£", name: "英鎊" },
};

export const DEFAULT_CURRENCY = "TWD";

export function isSupportedCurrency(code: string): boolean {
  return Object.hasOwn(CURRENCIES, code);
}

export function getCurrency(code: string): CurrencyMeta {
  const meta = CURRENCIES[code];
  if (!meta) {
    throw new Error(`Unknown currency: ${code}`);
  }
  return meta;
}

export function getExponent(code: string): number {
  return getCurrency(code).exponent;
}
