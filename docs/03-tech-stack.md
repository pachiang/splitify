# 03 — 技術選型 (ADR-lite)

每個決策記錄：**選擇 → 理由 → 被否決的替代**。目標一致：**agent 友善**（單一語言、型別安全、慣例清楚、語料充足）+ **起步免費** + **金額正確**。

## 摘要

| 面向 | 選擇 |
|---|---|
| 語言 | TypeScript (strict) 全棧 |
| 手機端 | Expo (React Native) + Expo Router |
| 前端狀態 | TanStack Query (server state) + Zustand (client state) |
| 驗證/型別 | Zod schema，前後端共用 (`packages/shared`) |
| 後端平台 | Supabase (Postgres / Auth / Realtime / Storage / Edge Functions) |
| 商業邏輯 | 純 TS `packages/core` + Supabase Edge Functions / Postgres function |
| Monorepo | pnpm workspaces + Turborepo |
| 付費 | RevenueCat + App Store / Google Play IAP |
| 推播 | Expo Push Notifications (底層 APNs/FCM) |
| 錯誤/分析 | Sentry + PostHog (皆有免費層) |
| 測試 | Vitest (單元) / RN Testing Library (元件) / Maestro (E2E) |
| CI/CD | GitHub Actions + EAS Build/Submit |

---

## ADR-001：跨平台框架 — Expo (React Native)

**選擇**：Expo + React Native + TypeScript。

**理由**
- 一份 codebase 上 iOS/Android。
- 與後端同為 TypeScript → 型別、Zod schema、商業邏輯 (`packages/core`) 可共用；agent 不必跨語言、不用猜 API 形狀。
- RN/TS 訓練語料遠多於 Flutter/Dart → agent 產出與修復品質更高 (本專案幾乎全程 agent 開發，這點權重很高)。
- Expo 封裝原生設定、推播、EAS Build、OTA 更新，省掉大量 native 雜務。

**否決**
- *Flutter*：效能/UI 一致性略優，但雙語言、無法與後端共用型別、agent 語料較少。
- *原生 (Swift + Kotlin)*：雙 codebase，對單人/agent 開發成本過高。

---

## ADR-002：後端平台 — Supabase

**選擇**：Supabase 作為 BaaS (Postgres + Auth + Realtime + Storage + Edge Functions)。

**理由**
- 分帳資料本質關聯式 (user/group/expense/split/settlement/balance)；**Postgres** 的交易與約束最適合保證帳務正確。
- 內建 Auth、Realtime (群組即時同步)、Storage (收據)、**Row Level Security** (多租戶授權)。
- 免費層足以跑完整 MVP；標準 Postgres，未來要搬遷 (自架 / AWS RDS) 成本低。
- SQL + PostgREST 慣例清楚，agent 好操作。

**否決**
- *Firebase / Firestore*：NoSQL 對關聯式帳務不友善，餘額一致性難保證。
- *Convex*：TS-native、很 agent 友善，但非標準 Postgres，鎖定較深、關聯式帳務仍偏好 SQL。
- *自建後端 + 自管 Postgres*：起步維運負擔高、要付主機費 (見 ADR-009)。

---

## ADR-003：Monorepo — pnpm + Turborepo

**選擇**：pnpm workspaces + Turborepo，前端/後端/共用邏輯同 repo。

**理由**
- 型別/schema 單一真相 (`packages/shared`)，前後端 import 同一份 → 改一處全棧同步。
- Turborepo 統一 `dev/build/test/lint` 入口與快取，agent 有一致指令面。
- 清楚的 package 邊界 + 每包 `CLAUDE.md`，agent 容易定位。

**否決**：多 repo (型別要靠發套件同步，摩擦高)；Nx (功能強但設定較重，Turborepo 對此規模剛好)。

---

## ADR-004：付費 — RevenueCat + 平台 IAP

**選擇**：RevenueCat 封裝 App Store / Google Play 內購。

**理由**
- iOS/Android 的**數位訂閱依規定必須走平台內購**；RevenueCat 抽象 StoreKit / Play Billing、管理跨平台訂閱與 entitlement，免費額度大。
- Webhook 同步訂閱狀態到 Supabase，App 依 entitlement 決定解鎖。

**否決**：直接串 StoreKit/Play Billing (雙平台狀態管理繁瑣、易錯)；App 內走 Stripe (違反商店規則、會被退件)。詳見 [06 變現](06-monetization.md)。

---

## ADR-005：金額表示 — 整數最小單位

**選擇**：金額一律以 `BIGINT` 儲存**最小貨幣單位** (例如新台幣以「元」的整數、日圓本身即整數、含分幣別以「分」)；每筆帶 `currency` (ISO 4217) 與該幣別的 `exponent` (小數位)。

**理由**：浮點數會累積誤差 → 分帳/對帳一定要精確。整數運算 + 明確餘數分配 (見 [05](05-data-model.md)) 才可稽核。

**否決**：float/double (禁用)；DECIMAL (可行，但整數更不易誤用、跨語言一致)。

---

## ADR-006：前端狀態 — TanStack Query + Zustand

**選擇**：伺服器資料用 TanStack Query (快取/同步/失效)，純本地 UI 狀態用 Zustand。

**理由**：分帳 App 幾乎都是伺服器資料；Query 處理快取/重取/樂觀更新，最少樣板。Zustand 補充少量本地狀態。

**否決**：Redux (樣板多)；只用 Context (無快取/失效能力)。

---

## ADR-007：驗證 — Zod (前後端共用)

**選擇**：以 Zod 定義所有 API/資料形狀於 `packages/shared`，前端表單驗證與後端輸入驗證共用同一 schema。

**理由**：單一真相、型別自動推導、agent 有明確契約可依循。

---

## ADR-008：測試 — Vitest / RN Testing Library / Maestro

**選擇**：核心邏輯 (`packages/core`) 用 Vitest 高覆蓋；元件用 React Native Testing Library；關鍵流程 E2E 用 Maestro (YAML，agent 好寫)。

**理由**：拆帳/餘額必須有紮實單元測試 (agent 自我驗證的基礎)；Maestro 比 Detox 設定簡單、對 agent 友善。

---

## ADR-009：部署 — 全免費起步，不用 AWS

**選擇**：Supabase Free + EAS + RevenueCat Free 起步；不採用 AWS 免費方案。

**理由**：AWS 需自拼 RDS/Cognito/Lambda/S3 = 重造 Supabase 已免費提供者；免費 12 個月倒數且易誤觸帳單；對 agent 開發維運負擔不划算。Postgres 未來要搬 AWS 也容易。詳見 [09 部署](09-deployment.md)。

**唯一必付**：Apple 開發者 US$99/年、Google Play US$25 一次性。
