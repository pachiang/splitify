# @splitify/core

**分帳正確性的核心。** 純 TypeScript、無 I/O、無副作用 → 好測、好共用。前端顯示、Supabase Edge Function 寫入驗證都呼叫這裡的同一套邏輯。

## 模組
- `money.ts` — 金額格式化與主單位↔最小單位轉換 (`formatMoney` / `toMinor` / `fromMinor`)。
- `allocate.ts` — 最大餘數法整數分配 (所有拆帳的底層原語),保證 Σ === total。
- `split.ts` — `computeSplits`:equal / exact / percentage / shares (itemized/adjustment 待實作)。
- `balance.ts` — `computeBalances`:算每人淨額,Σ net === 0。
- `simplify.ts` — `simplifyDebts`:最少筆數轉帳建議。

## 鐵則
- **只用整數 minor units 運算**,不引入浮點金額;不做四捨五入以外的浮點比較。
- 所有分配/計算必須**確定性** (同輸入同輸出) 且**加總守恆**。
- 任何新函式都要附單元測試,涵蓋整除/不整除/邊界 (見既有 `*.test.ts`)。
- 不 import 任何 I/O、平台或框架 (React/Supabase/Node fs…);保持純函式。

## 稽核不變量 (已寫成測試,新增邏輯請維持)
1. 拆帳:Σ owed === total。
2. 餘額:Σ net === 0。
3. 簡化債務:Σ 建議金額 === Σ 正淨額,且套用後全歸零。

## 指令
```bash
pnpm --filter @splitify/core test
pnpm --filter @splitify/core type-check
```
