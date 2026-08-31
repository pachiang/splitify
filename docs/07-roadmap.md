# 07 — 產品路線圖

分階段推進，每階段有明確**完成標準 (exit criteria)**。順序可依現實調整，但「金額正確 + 核心記帳流暢」永遠優先於功能廣度。

## Phase 0 — 地基 (Foundation)

建立可持續 agent 開發的骨架。

- Monorepo (pnpm + Turborepo)、`packages/{core,shared,config}`、`apps/mobile` (Expo)、`supabase/`。
- Supabase 專案 (dev)、基本 schema + RLS 首版 migration。
- `packages/core` 拆帳/餘額函式 + 單元測試 (先行，因為它無 I/O 最好測)。
- CI (lint + type-check + test)、Sentry、基本 CLAUDE.md 各包到位。

**完成標準**：`pnpm install && pnpm test && pnpm lint` 綠燈；App 能連上 Supabase 並登入一個測試帳號。

## Phase 1 — MVP (免費核心)

目標：一群人能真的用它把一趟旅行/一個月合租帳分清楚。

- 認證：Email + Google + Apple 登入；個人檔案。
- 群組：建立/編輯/封存、成員管理、佔位成員、邀請連結。
- 好友 1:1 分帳。
- 記帳：新增/編輯/刪除，拆帳 **均分 + 指定金額**，單一付款人，分類，收據上傳。
- 餘額總覽 + 誰欠誰；結帳 (settle up) 記錄。
- 活動時間軸 (基本)。
- 推播 (新帳目/被加入/被結帳)。
- 即時同步 (Realtime)。
- 深色模式。

**完成標準**：真人 dogfooding 一趟旅遊/一個月合租，帳目正確、同步即時、無阻斷性 bug；核心流程有 Maestro E2E。

## Phase 2 — 補強與差異化

- 拆帳：**百分比 / 份數**；多付款人。
- **簡化債務 (simplify debts)**。
- 多幣別記帳 (內部主幣別彙總)。
- 帳目留言、活動時間軸強化。
- **Line 登入 + 分享帳單/結算到 Line** (台灣在地化重點)。
- i18n (繁中/英文)。
- 結帳時在地支付跳轉 (Line Pay 連結)。
- 定期帳單 (基礎)。

**完成標準**:台灣目標用戶能用 Line 無痛邀人 + 分享;多幣別旅遊情境可用。

## Phase 3 — Pro 上線 (Freemium 變現)

- RevenueCat 整合、`entitlements`、paywall、恢復購買。
- Pro 功能:**AI 收據掃描 (OCR)**、**消費分析圖表**、**匯出 CSV/PDF**、**多幣別自動換算**、逐項拆帳、自訂分類/主題。
- 訂閱條款/隱私政策、Small Business Program 申請。
- paywall 事件追蹤 (PostHog)。

**完成標準**:可完成一筆真實訂閱、Pro 功能受伺服器 entitlement 控管、通過商店審核。

## Phase 4 — 成長

- 推薦獎勵 (referral)、更強的邀請病毒機制。
- Line Pay 整合深化、其他在地支付。
- Web 版 (+ Stripe 訂閱以降抽成)。
- Widgets、捷徑、離線寫入強化。
- 更多市場 i18n 與在地化。
- 銀行/發票匯入等進階整合 (評估)。

**完成標準**:K-factor 與付費轉換達到可規模化投放的門檻。

---

## MVP 範圍一句話

**「登入 → 建群組/邀人 → 均分或指定金額記帳 → 看誰欠誰 → 結帳」** 全程順暢、即時同步、金額零誤差、免費無廣告。其餘一律往後排。

## 排序原則

1. 先做**無 I/O 的核心計算 + 測試** (`packages/core`),因為它是正確性的根、且最好測。
2. 再做**一條端到端垂直切片** (登入→建群→記一筆→看餘額),打通全棧管線。
3. 之後每個功能都以**垂直切片**方式補齊 (見 [08](08-agent-workflow.md))。
