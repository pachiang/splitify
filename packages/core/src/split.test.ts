import { describe, expect, it } from "vitest";
import { allocate } from "./allocate";
import { computeSplits, type SplitConfig } from "./split";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const owedOf = (rs: { owed: number }[]) => rs.map((r) => r.owed);

describe("allocate", () => {
  it("均分不整除 → 前面的人多分 1 (確定性)", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(10, [1, 1, 1])).toEqual([4, 3, 3]);
  });

  it("均分整除", () => {
    expect(allocate(100, [1, 1, 1, 1])).toEqual([25, 25, 25, 25]);
  });

  it("依權重比例", () => {
    expect(allocate(100, [1, 1, 2])).toEqual([25, 25, 50]);
    expect(sum(allocate(100, [1, 1, 2]))).toBe(100);
  });

  it("weights 全為 0 視為均分", () => {
    expect(allocate(9, [0, 0, 0])).toEqual([3, 3, 3]);
  });

  it("各種金額都保證加總等於 total", () => {
    for (const total of [1, 2, 7, 99, 100, 101, 1000, 12345]) {
      for (const w of [
        [1, 1, 1],
        [1, 2, 3],
        [5, 5, 5, 5, 1],
      ]) {
        expect(sum(allocate(total, w))).toBe(total);
      }
    }
  });

  it("非整數 total 會丟錯", () => {
    expect(() => allocate(10.5, [1, 1])).toThrow();
  });
});

describe("computeSplits", () => {
  const members = ["a", "b", "c"];

  it("equal:加總等於總額", () => {
    const r = computeSplits(100, members, { type: "equal" });
    expect(owedOf(r)).toEqual([34, 33, 33]);
    expect(sum(owedOf(r))).toBe(100);
  });

  it("exact:加總正確才通過", () => {
    const cfg: SplitConfig = { type: "exact", amounts: { a: 50, b: 30, c: 20 } };
    expect(sum(owedOf(computeSplits(100, members, cfg)))).toBe(100);
    expect(() =>
      computeSplits(100, members, { type: "exact", amounts: { a: 50, b: 30, c: 10 } }),
    ).toThrow();
  });

  it("percentage:允許 33.33+33.33+33.34,且加總等於總額", () => {
    const cfg: SplitConfig = { type: "percentage", percentages: { a: 33.34, b: 33.33, c: 33.33 } };
    expect(sum(owedOf(computeSplits(100, members, cfg)))).toBe(100);
    expect(() =>
      computeSplits(100, members, { type: "percentage", percentages: { a: 50, b: 30, c: 10 } }),
    ).toThrow();
  });

  it("shares:依份數分配", () => {
    const cfg: SplitConfig = { type: "shares", shares: { a: 1, b: 1, c: 2 } };
    expect(owedOf(computeSplits(100, members, cfg))).toEqual([25, 25, 50]);
    expect(() =>
      computeSplits(100, members, { type: "shares", shares: { a: 0, b: 0, c: 0 } }),
    ).toThrow();
  });

  it("沒有成員會丟錯", () => {
    expect(() => computeSplits(100, [], { type: "equal" })).toThrow();
  });
});
