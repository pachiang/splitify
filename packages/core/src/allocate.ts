/**
 * 把整數 `total` 依 `weights` 比例分配成整數陣列,**保證 Σ 結果 === total**。
 *
 * 餘數用「最大餘數法 (largest remainder)」分配;分數部分相同時依索引順序,
 * 確保**同輸入永遠同輸出** (可測、可稽核)。
 *
 * - weights 全為 0 → 視為均分。
 * - total 可為負 (餘數以 -1 反向分配)。
 */
export function allocate(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (!Number.isInteger(total)) {
    throw new Error("allocate: total 必須是整數 (minor units)");
  }
  if (weights.some((w) => w < 0)) {
    throw new Error("allocate: weights 不可為負");
  }

  const sumW = weights.reduce((a, b) => a + b, 0);
  const effective = sumW > 0 ? weights : weights.map(() => 1);
  const effSum = sumW > 0 ? sumW : n;

  const raw = effective.map((w) => (total * w) / effSum);
  const floors = raw.map((r) => Math.floor(r));
  const allocated = floors.reduce((a, b) => a + b, 0);
  let remainder = total - allocated;

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const result = floors.slice();
  const step = remainder >= 0 ? 1 : -1;
  remainder = Math.abs(remainder);
  for (let k = 0; k < remainder; k++) {
    const target = order[k % n];
    result[target.i] += step;
  }
  return result;
}
