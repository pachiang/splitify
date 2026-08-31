# @splitify/shared

**型別與資料契約的單一真相。** 前端表單驗證、後端 Edge Function 輸入驗證都 import 這裡的 Zod schema,不各自定義。

## 內容
- `currency.ts` — 幣別中繼資料 (含 `exponent` 小數位) 與查詢函式。
- `schema.ts` — Zod schema + 由其推導的型別 (`SplitType`、`ExpenseInput`…)。

## 規則
- 只放**純資料與 schema**,不放商業邏輯 (計算放 [@splitify/core](../core/CLAUDE.md))。
- 金額一律整數 minor units;新增帶金額的 schema 用 `positiveMinorSchema` / `minorAmountSchema`。
- 改動 schema = 改動全棧契約,前後端會一起受影響,務必同步。

## 指令
```bash
pnpm --filter @splitify/shared test
pnpm --filter @splitify/shared type-check
```
