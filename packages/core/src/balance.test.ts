import { describe, expect, it } from "vitest";
import { computeBalances, type ExpenseEntry } from "./balance";

const sumNet = (net: Record<string, number>) => Object.values(net).reduce((a, b) => a + b, 0);

describe("computeBalances", () => {
  it("A 付 100、AB 均分 → A +50, B -50", () => {
    const expenses: ExpenseEntry[] = [
      {
        payers: [{ memberId: "a", amount: 100 }],
        splits: [
          { memberId: "a", amount: 50 },
          { memberId: "b", amount: 50 },
        ],
      },
    ];
    const net = computeBalances(["a", "b"], expenses);
    expect(net.a).toBe(50);
    expect(net.b).toBe(-50);
    expect(sumNet(net)).toBe(0);
  });

  it("結帳後歸零 (驗證結算方向)", () => {
    const expenses: ExpenseEntry[] = [
      {
        payers: [{ memberId: "a", amount: 100 }],
        splits: [
          { memberId: "a", amount: 50 },
          { memberId: "b", amount: 50 },
        ],
      },
    ];
    // B 付給 A 50 結清
    const net = computeBalances(["a", "b"], expenses, [{ from: "b", to: "a", amount: 50 }]);
    expect(net.a).toBe(0);
    expect(net.b).toBe(0);
  });

  it("多筆多人:Σ net 恆為 0", () => {
    const expenses: ExpenseEntry[] = [
      {
        payers: [{ memberId: "a", amount: 900 }],
        splits: [
          { memberId: "a", amount: 300 },
          { memberId: "b", amount: 300 },
          { memberId: "c", amount: 300 },
        ],
      },
      {
        payers: [{ memberId: "b", amount: 100 }],
        splits: [
          { memberId: "b", amount: 34 },
          { memberId: "c", amount: 33 },
          { memberId: "a", amount: 33 },
        ],
      },
    ];
    const net = computeBalances(["a", "b", "c"], expenses);
    expect(sumNet(net)).toBe(0);
  });
});
