import { allocate } from "./allocate";

export type SplitConfig =
  | { type: "equal" }
  | { type: "exact"; amounts: Record<string, number> }
  | { type: "percentage"; percentages: Record<string, number> }
  | { type: "shares"; shares: Record<string, number> };

export interface SplitResult {
  memberId: string;
  owed: number;
}

/** percentage 加總允許的誤差 (使用者可能輸入 33.33 + 33.33 + 33.34)。 */
const PERCENT_TOLERANCE = 0.011;

/**
 * 依拆帳方式,把 `total` (最小單位整數) 分攤給 `memberIds`,回傳每人 owed。
 * **保證 Σ owed === total。**
 *
 * 注意:itemized / adjustment 於 Phase 0 尚未實作 (見 docs/05 §5)。
 */
export function computeSplits(
  total: number,
  memberIds: string[],
  config: SplitConfig,
): SplitResult[] {
  if (memberIds.length === 0) {
    throw new Error("computeSplits: 至少要有一位成員");
  }

  switch (config.type) {
    case "equal": {
      const owed = allocate(
        total,
        memberIds.map(() => 1),
      );
      return memberIds.map((id, i) => ({ memberId: id, owed: owed[i] }));
    }
    case "exact": {
      const amounts = memberIds.map((id) => config.amounts[id] ?? 0);
      const sum = amounts.reduce((a, b) => a + b, 0);
      if (sum !== total) {
        throw new Error(`exact 拆帳加總 ${sum} 不等於總額 ${total}`);
      }
      return memberIds.map((id, i) => ({ memberId: id, owed: amounts[i] }));
    }
    case "percentage": {
      const pcts = memberIds.map((id) => config.percentages[id] ?? 0);
      const sum = pcts.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > PERCENT_TOLERANCE) {
        throw new Error(`percentage 加總 ${sum} 不等於 100`);
      }
      const owed = allocate(total, pcts);
      return memberIds.map((id, i) => ({ memberId: id, owed: owed[i] }));
    }
    case "shares": {
      const shares = memberIds.map((id) => config.shares[id] ?? 0);
      if (shares.every((s) => s === 0)) {
        throw new Error("shares 不可全為 0");
      }
      const owed = allocate(total, shares);
      return memberIds.map((id, i) => ({ memberId: id, owed: owed[i] }));
    }
    default: {
      const exhaustive: never = config;
      throw new Error(`未支援的拆帳方式: ${JSON.stringify(exhaustive)}`);
    }
  }
}
