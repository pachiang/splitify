import { describe, expect, it } from "vitest";
import { formatMoney, fromMinor, toMinor } from "./money";

describe("formatMoney", () => {
  it("零小數位幣別 (TWD) 加千分位", () => {
    expect(formatMoney(123456, "TWD")).toBe("NT$123,456");
    expect(formatMoney(0, "TWD")).toBe("NT$0");
  });

  it("兩位小數幣別 (USD)", () => {
    expect(formatMoney(1234, "USD")).toBe("$12.34");
    expect(formatMoney(5, "USD")).toBe("$0.05");
    expect(formatMoney(0, "USD")).toBe("$0.00");
  });

  it("負數", () => {
    expect(formatMoney(-5000, "TWD")).toBe("-NT$5,000");
  });

  it("可關閉符號與千分位", () => {
    expect(formatMoney(123456, "TWD", { withSymbol: false, withGrouping: false })).toBe("123456");
  });
});

describe("toMinor / fromMinor", () => {
  it("USD 兩位小數往返", () => {
    expect(toMinor(12.34, "USD")).toBe(1234);
    expect(fromMinor(1234, "USD")).toBe(12.34);
  });

  it("TWD 無小數", () => {
    expect(toMinor(100, "TWD")).toBe(100);
    expect(fromMinor(100, "TWD")).toBe(100);
  });

  it("避免浮點誤差 (四捨五入到最小單位)", () => {
    expect(toMinor(19.99, "USD")).toBe(1999);
    expect(toMinor(0.1 + 0.2, "USD")).toBe(30);
  });
});
