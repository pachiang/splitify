export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * 由淨額 (見 computeBalances) 產生**最少筆數**的轉帳建議 (貪婪法)。
 *
 * - `from` = 債務人 (net < 0),`to` = 債權人 (net > 0)。
 * - 依金額大到小配對,平手用 id 排序 → 結果具**確定性**。
 *
 * 不變量:
 *   - Σ 建議金額 === Σ 正淨額 (= Σ |負淨額|)。
 *   - 套用所有建議後,每位成員 net → 0。
 */
export function simplifyDebts(netByMember: Record<string, number>): Transaction[] {
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  for (const [id, net] of Object.entries(netByMember)) {
    if (net < 0) {
      debtors.push({ id, amount: -net });
    } else if (net > 0) {
      creditors.push({ id, amount: net });
    }
  }

  const byAmountThenId = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || (a.id < b.id ? -1 : 1);
  debtors.sort(byAmountThenId);
  creditors.sort(byAmountThenId);

  const txns: Transaction[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = Math.min(d.amount, c.amount);
    if (pay > 0) {
      txns.push({ from: d.id, to: c.id, amount: pay });
      d.amount -= pay;
      c.amount -= pay;
    }
    if (d.amount === 0) i++;
    if (c.amount === 0) j++;
  }

  return txns;
}
