# 08 — Agent 開發流程

本專案幾乎全程由 agent 開發。此文件是讓 agent 高效、低錯誤、可自我驗證的規範。

## 1. 核心原則

1. **單一語言、單一真相**:全 TypeScript;型別/schema 只在 `packages/shared` 定義一次,前後端 import。
2. **垂直切分**:一個功能的改動集中在一個 `features/<name>/` 或一個 package,減少跨檔跳躍。
3. **純邏輯與 I/O 分離**:可計算的東西 (拆帳/餘額/格式化) 放 `packages/core`,純函式、無副作用、易測。
4. **可自我驗證**:每個改動都能用 `pnpm test` / `pnpm type-check` / `pnpm lint` 客觀驗證;金額相關必附測試。
5. **文件即真相**:動到架構/資料模型/範圍,回頭更新 `docs/`。

## 2. 專案慣例 (東西放哪)

| 要做的事 | 放哪 |
|---|---|
| 新資料形狀 / API 契約 | `packages/shared` (Zod schema + 型別) |
| 拆帳/餘額/簡化債務/金額運算 | `packages/core` (純 TS + 單元測試) |
| 需交易/驗證/第三方的寫入 | `supabase/functions/<name>/` (Edge Function,呼叫 core) |
| DB 結構 / RLS 變更 | `supabase/migrations/` (新增 migration,不改舊的) |
| 畫面 / 該功能的 hooks 與元件 | `apps/mobile/src/features/<name>/` |
| 跨功能共用 UI | `apps/mobile/src/components/` |
| supabase/revenuecat/query client 初始化 | `apps/mobile/src/lib/` |

## 3. 程式風格

- TypeScript **strict**;避免 `any`,用 Zod 推導型別。
- 命名:檔案/資料夾 `kebab-case`,型別/元件 `PascalCase`,變數/函式 `camelCase`,DB 欄位 `snake_case`。
- 錯誤處理:Edge Function 回明確錯誤碼與訊息;前端用 Query 的 error 狀態呈現。
- **金額**:一律用 `packages/core` 的工具函式處理與格式化,不在各處硬除 100。
- 註解密度與風格向周遭程式碼看齊。

## 4. 測試策略

| 層級 | 工具 | 對象 |
|---|---|---|
| 單元 | Vitest | `packages/core` (拆帳/餘額/簡化債務,**高覆蓋**);`shared` schema |
| 整合 | Vitest + 本地 Supabase | Edge Functions、RLS policy (含「非成員存取被擋」) |
| 元件 | React Native Testing Library | 關鍵畫面/表單 |
| E2E | Maestro (YAML) | MVP 關鍵流程:登入→建群→記帳→看餘額→結帳 |

**稽核不變量**要寫成測試 (見 [05 §9](05-data-model.md)):Σ splits==total、Σ net==0、簡化後全歸零。

## 5. Definition of Done (每個 PR/任務)

- [ ] `pnpm type-check` 通過
- [ ] `pnpm lint` 通過
- [ ] `pnpm test` 通過 (新邏輯有對應測試)
- [ ] 金額相關改動有涵蓋整除/不整除/邊界的測試
- [ ] 若改資料形狀 → 更新 `packages/shared` 且前後端一致
- [ ] 若改 DB → 新增 migration + 對應 RLS + 測試
- [ ] 若改架構/範圍 → 更新對應 `docs/`
- [ ] 手動或 E2E 驗證過主要流程

## 6. 功能開發配方 (端到端垂直切片)

以「新增一種拆帳法」或「新功能」為例,依序:

1. **定契約**:在 `packages/shared` 加/改 Zod schema 與型別。
2. **寫純邏輯 + 測試**:在 `packages/core` 實作計算,先寫測試 (含邊界)。
3. **後端**:需要的話在 `supabase/functions` 或 migration 落地 (呼叫 core、加 RLS),寫整合測試。
4. **前端**:在 `features/<name>/` 加 hooks (TanStack Query 呼叫後端) 與畫面。
5. **驗證**:type-check / lint / test + 手動或 Maestro 跑一次主流程。
6. **文件**:更新 `docs/` 與該 package 的 `CLAUDE.md` (若慣例有變)。

> **建議**:一次做**一條薄薄的垂直切片**打通全棧,而不是先把某一層做完。這樣每步都能端到端驗證,agent 較不會累積偏差。

## 7. CLAUDE.md 策略

- 根 `CLAUDE.md`:專案總覽、鐵則、結構、指令入口。
- 每個 package/`apps/mobile` 一份 `CLAUDE.md`:該範圍的用途、慣例、如何跑測試、常見陷阱。
- 保持精簡、指向 `docs/` 而非複製內容。

## 8. Git / PR 慣例

- 小步提交,一個 PR 一個垂直切片或一個明確修正。
- Commit 訊息說清楚「為什麼」。
- 不把 secrets 進版控 (用 `.env.local` / EAS secrets)。

## 9. 給 agent 的安全鐵則

- **金額計算永遠伺服器權威**;不信任 client 傳來的 owed/paid 結論,Edge Function 內重算並驗證加總。
- **每張含使用者資料的表都要有 RLS**,並測「非成員讀不到」。
- **service role key / 第三方金鑰只在 Edge Function 環境**,絕不進 App bundle 或版控。
- **付費解鎖以伺服器 entitlement 為準**,App 端判斷僅為體驗。
- 不在 URL/query string 放個資或敏感資料。

## 10. 指令 (待骨架建立後補齊)

規劃中的統一入口 (Turborepo):

```bash
pnpm install          # 安裝
pnpm dev              # 起 App (Expo) / 本地 Supabase
pnpm test             # 全部測試
pnpm type-check       # 型別檢查
pnpm lint             # 靜態檢查
pnpm --filter @splitify/core test   # 只測 core
```
