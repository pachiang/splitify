export interface PayerEntry {
  memberId: string;
  amount: number;
}

export interface OwedEntry {
  memberId: string;
  amount: number;
}

export interface ExpenseEntry {
  payers: PayerEntry[];
  splits: OwedEntry[];
}

export interface SettlementEntry {
  from: string;
  to: string;
  amount: number;
}

/**
 * 計算每位成員的淨額 (最小單位整數)。
 *
 *   net(m) =  Σ 付出的金額 (paid)
 *           − Σ 該分攤的金額 (owed)
 *           + Σ 以 from 身分付出的結算 (settle out)
 *           − Σ 以 to 身分收到的結算 (settle in)
 *
 * net > 0 → 別人淨欠他 (債權人);net < 0 → 他淨欠別人 (債務人)。
 * 不變量:同一群組所有成員 **Σ net === 0**。
 */
export function computeBalances(
  memberIds: string[],
  expenses: ExpenseEntry[],
  settlements: SettlementEntry[] = [],
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const id of memberIds) {
    net[id] = 0;
  }
  const add = (id: string, delta: number) => {
    net[id] = (net[id] ?? 0) + delta;
  };

  for (const exp of expenses) {
    for (const p of exp.payers) {
      add(p.memberId, p.amount);
    }
    for (const s of exp.splits) {
      add(s.memberId, -s.amount);
    }
  }

  for (const st of settlements) {
    // 債務人 (from) 付錢出去 → 負債減少 → net 上升
    add(st.from, st.amount);
    add(st.to, -st.amount);
  }

  return net;
}
