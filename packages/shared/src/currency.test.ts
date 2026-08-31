import { describe, expect, it } from "vitest";
import { getCurrency, getExponent, isSupportedCurrency } from "./currency";
import { currencyCodeSchema, expenseInputSchema } from "./schema";

describe("currency", () => {
  it("TWD/JPY 沒有小數位", () => {
    expect(getExponent("TWD")).toBe(0);
    expect(getExponent("JPY")).toBe(0);
  });

  it("USD 有兩位小數", () => {
    expect(getExponent("USD")).toBe(2);
  });

  it("未知幣別會丟錯", () => {
    expect(() => getCurrency("XYZ")).toThrow();
    expect(isSupportedCurrency("XYZ")).toBe(false);
  });
});

describe("schema", () => {
  it("currencyCodeSchema 只接受支援的幣別", () => {
    expect(currencyCodeSchema.safeParse("TWD").success).toBe(true);
    expect(currencyCodeSchema.safeParse("XYZ").success).toBe(false);
  });

  it("expenseInputSchema 擋掉非整數/負數金額", () => {
    const base = {
      description: "晚餐",
      currency: "TWD",
      splitType: "equal" as const,
      paidBy: [{ memberId: "a", amount: 900 }],
      memberIds: ["a", "b", "c"],
    };
    expect(expenseInputSchema.safeParse({ ...base, totalAmount: 900 }).success).toBe(true);
    expect(expenseInputSchema.safeParse({ ...base, totalAmount: 9.5 }).success).toBe(false);
    expect(expenseInputSchema.safeParse({ ...base, totalAmount: -1 }).success).toBe(false);
  });
});
