import { describe, expect, it } from "vitest";
import { simplifyDebts, type Transaction } from "./simplify";

function applyTransactions(
  net: Record<string, number>,
  txns: Transaction[],
): Record<string, number> {
  const result = { ...net };
  for (const t of txns) {
    result[t.from] = (result[t.from] ?? 0) + t.amount;
    result[t.to] = (result[t.to] ?? 0) - t.amount;
  }
  return result;
}

const allZero = (net: Record<string, number>) => Object.values(net).every((v) => v === 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("simplifyDebts", () => {
  it("單純一對:B 欠 A 50", () => {
    const txns = simplifyDebts({ a: 50, b: -50 });
    expect(txns).toEqual([{ from: "b", to: "a", amount: 50 }]);
  });

  it("套用建議後所有淨額歸零", () => {
    const net = { a: 30, b: 20, c: -50 };
    const txns = simplifyDebts(net);
    expect(allZero(applyTransactions(net, txns))).toBe(true);
    expect(sum(txns.map((t) => t.amount))).toBe(50);
  });

  it("較複雜情境仍守恆且歸零", () => {
    const net = { a: -40, b: -10, c: 25, d: 25 };
    const txns = simplifyDebts(net);
    expect(allZero(applyTransactions(net, txns))).toBe(true);
    // 轉帳筆數不超過 (成員數 - 1)
    expect(txns.length).toBeLessThanOrEqual(3);
  });

  it("確定性:同輸入同輸出", () => {
    const net = { a: 30, b: 20, c: -50 };
    expect(simplifyDebts(net)).toEqual(simplifyDebts(net));
  });

  it("全部為 0 → 無需轉帳", () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });
});
