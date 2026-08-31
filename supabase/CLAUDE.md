# supabase

Supabase 專案:Postgres schema、RLS policies、Edge Functions。

## 結構

```
supabase/
├── migrations/   # 版本化 SQL(schema + RLS + storage)
└── functions/    # Edge Functions (Deno / TS) — Phase 1 起實作
```

## 鐵則

1. **Schema 變更一律新增 migration**,永遠不要改動已存在的 migration 檔,也不要手改線上 DB。
2. **每張含使用者資料的表都要有 RLS policy**,並且要有「非成員讀不到」的測試。
3. **金額相關的寫入不開放 client 直寫**(expenses / expense_payers / expense_splits /
   settlements 只有 SELECT policy)。寫入走 Edge Function 以 service role 執行,
   並在交易內用 `@splitify/core` 重算、驗證加總,維持伺服器權威。
4. **金額欄位一律 `bigint` 存最小單位**(minor units),禁用 float / numeric。
5. `entitlements` 只能由 RevenueCat webhook (service role) 寫入,使用者唯讀 ——
   付費解鎖以這張表為準,不信任 client。

## RLS 的遞迴陷阱

`group_members` 的 policy 若直接查 `group_members` 會無限遞迴,因此改用
`SECURITY DEFINER` helper(`is_group_member` / `is_group_admin` / `can_access_expense`)
繞過 RLS。這些 function 都固定了 `search_path`,新增同類 helper 時請比照辦理。

## 資料模型重點

- 好友 1:1 分帳用**隱含的雙人群組**(`groups.type = 'friend'`)表示,
  因此 `expenses.group_id` 一律 NOT NULL,`expense_splits` 才能一致指向 `group_members`。
- 尚未註冊的成員以 `group_members.user_id = null` 的「佔位成員」表示,
  對方註冊後再把 `user_id` 綁上,歷史帳目自動歸屬。

詳見 [docs/05-data-model.md](../docs/05-data-model.md)。

## 指令

```bash
supabase start              # 本機起 Supabase(需安裝 supabase CLI)
supabase db reset           # 重跑所有 migration
supabase db push            # 套用 migration 到遠端專案
supabase functions deploy   # 部署 Edge Functions
```
