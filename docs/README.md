# Splitify — 規劃文件

一款跨平台 (iOS / Android) 分帳 App,對標 Splitwise,採 **freemium** 模式:核心免費、進階功能付費訂閱。主打「更好用的介面、更佛的免費額度、在地化 (台灣/亞洲) 與 AI 功能」。

> **Phase 0 已完成**:monorepo 骨架、`packages/{config,shared,core}`、`apps/mobile` (Expo SDK 57)、
> `supabase/` (schema + RLS + 測試)、CI 皆已建立並驗證通過。
> 文件中的 SQL 與介面為設計說明,**實作以 `supabase/migrations/` 與各 package 原始碼為準**;
> 更動架構/資料模型時請回頭更新對應文件,維持「文件即真相」。

## 目前狀態

| 面向 | 決策 |
|---|---|
| 手機端 | ✅ Expo (React Native) + TypeScript |
| 後端平台 | ✅ Supabase (Postgres / Auth / Realtime / Storage / Edge Functions) |
| Monorepo | ✅ pnpm workspaces + Turborepo |
| 付費 | ✅ RevenueCat + App Store / Google Play 內購 (IAP) |
| 起步部署 | ✅ 全免費方案 (Supabase Free + EAS + RevenueCat Free);不採用 AWS |
| 開發方式 | ✅ 幾乎全程 agent 驅動 → 架構以 agent 友善為第一優先 |
| 進度 | ✅ Phase 0 完成(見 [07-roadmap](07-roadmap.md));下一步 Phase 1 MVP |

## 閱讀順序

| # | 文件 | 內容 |
|---|---|---|
| 01 | [產品需求 (PRD)](01-prd.md) | 願景、目標用戶、功能清單 (依 MVP/後續/付費 分級)、使用者故事、成功指標 |
| 02 | [競品分析](02-competitive-analysis.md) | Splitwise 與其他競品拆解、我們的定位與差異化 |
| 03 | [技術選型](03-tech-stack.md) | 每個技術決策的理由 (ADR-lite) 與被否決的替代方案 |
| 04 | [系統架構](04-architecture.md) | Monorepo 佈局、前端/後端架構、資料流、安全模型 |
| 05 | [資料模型](05-data-model.md) | 資料表 (含 SQL 草案)、金額表示、拆帳/餘額/簡化債務演算法、RLS |
| 06 | [變現模式](06-monetization.md) | 免費 vs Pro 分級、定價、IAP/RevenueCat 架構、平台規則注意事項 |
| 07 | [產品路線圖](07-roadmap.md) | Phase 0–4、MVP 範圍與各階段完成標準 |
| 08 | [Agent 開發流程](08-agent-workflow.md) | 讓 agent 高效開發的慣例、測試策略、Definition of Done、功能開發配方 |
| 09 | [部署與維運](09-deployment.md) | 環境、CI/CD、上架、監控、成本表 |

## 給 agent 的重點提示

實作時務必遵守下列跨文件的核心規則 (詳見各文件):

1. **金額一律用整數最小貨幣單位 (minor units, 例如「分」) 儲存**,禁用浮點數 → 避免對帳誤差。見 [05](05-data-model.md)。
2. **金額計算 (拆帳、餘額、結算) 一律伺服器權威**,不信任 client 傳來的結果 → 商業邏輯放 `packages/core` 與 Supabase (Edge Functions / Postgres function)。見 [04](04-architecture.md)。
3. **端到端型別安全**:資料形狀以 Zod schema 定義於 `packages/shared`,前後端共用。
4. **多租戶授權靠 Postgres RLS**,不能只靠 client 過濾。見 [05](05-data-model.md)。
5. 每個 package / 重要資料夾放一份 `CLAUDE.md`,說明用途、慣例與指令。見 [08](08-agent-workflow.md)。
