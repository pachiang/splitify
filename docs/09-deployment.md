# 09 — 部署與維運

## 1. 環境

三套環境,各自獨立的 Supabase 專案與設定:

| 環境 | 用途 | Supabase | App |
|---|---|---|---|
| dev | 本地開發 | 本地 (supabase CLI) 或一個 dev 專案 | Expo Dev Client |
| staging | 內測 / dogfooding | staging 專案 | EAS internal / TestFlight / Play internal |
| prod | 正式 | prod 專案 | App Store / Play 正式版 |

設定值 (Supabase URL/anon key、RevenueCat key…) 以 Expo public env + EAS secrets 管理;**service role key 與第三方密鑰只在 Supabase Edge Function 環境**,不進 App。

## 2. Supabase 流程

- Schema/RLS 變更一律以 **`supabase/migrations/` 版本化 SQL**;用 `supabase db push` / CI 套用,不手改線上。
- Edge Functions 用 `supabase functions deploy`。
- 分環境切換用不同專案 ref;CI 部署到 staging/prod。
- 免費層注意:閒置一段時間專案會被暫停 → 開發期無妨,正式上線前升級或保活。

## 3. App 建置與上架 (EAS)

- **EAS Build**:雲端建 iOS/Android 二進位;免費額度有限,亦可本機建。
- **EAS Submit**:上傳到 App Store Connect / Play Console。
- **EAS Update (OTA)**:JS 層更新免送審即可推 (原生變更仍需重新送審)。
- Build profile:`development` / `preview (internal)` / `production`。
- 內測:iOS TestFlight、Android Play Internal Testing。

## 4. RevenueCat 設定

- 在 App Store Connect / Play Console 建訂閱商品 → 綁到 RevenueCat 的 offering/entitlement (`pro`)。
- 設定 Webhook → Supabase Edge Function `revenuecat-webhook` → 寫 `entitlements`。
- 記得申請 **Small Business Program (15% 抽成)**。

## 5. CI/CD (GitHub Actions)

- **PR**:install → type-check → lint → test (Turborepo 快取加速)。
- **merge 到 main**:部署 Supabase migrations/functions 到 staging;可選 EAS preview build。
- **release tag**:部署 prod + EAS production build/submit。
- secrets 放 GitHub Actions secrets。

## 6. 監控與分析 (免費層起步)

- **Sentry**:App 與 Edge Function 錯誤追蹤。
- **PostHog** (或 Amplitude 免費層):產品分析、漏斗、paywall 事件、留存。
- Supabase 內建 logs/metrics 看 DB/函式狀況。

## 7. 成本表 (起步)

| 項目 | 方案 | 費用 |
|---|---|---|
| DB / Auth / Storage / Realtime / Functions | Supabase Free | $0 |
| App build / OTA | EAS 免費額度 or 本機 | $0 |
| 訂閱金流管理 | RevenueCat 免費額度 | $0 |
| 推播 | Expo Push / FCM | $0 |
| 錯誤/分析 | Sentry / PostHog Free | $0 |
| 版控 / CI | GitHub (+ Actions 免費額度) | $0 |
| **Apple 開發者** | 上架 / TestFlight 必需 | **US$99 / 年** |
| **Google Play** | 上架必需 | **US$25 一次** |
| 網域 (選配) | 官網 / deep link | ~US$10–15 / 年 |

**擴張後**才會開始付費的點:Supabase Pro (超出免費額度或要保活/更大 DB)、EAS 付費 (更多雲端 build)、RevenueCat (超過營收門檻)。屆時再評估。

## 8. 為何暫不使用 AWS

- 需自拼 RDS/Cognito/Lambda/S3/API Gateway = 重造 Supabase 已免費提供者,維運成本高。
- 免費是 **12 個月倒數**,且設定不慎易產生**超額帳單**。
- 對「幾乎全 agent 開發」的團隊,managed BaaS 的可預期性與低摩擦更重要。
- 未來若因成本結構 (規模) 需要遷移,標準 Postgres 搬到 AWS RDS 相對容易 → 現在不鎖死。

## 9. 上線前檢查 (擇要)

- [ ] 隱私政策 / 服務條款頁面與連結 (商店審核必查)
- [ ] Apple Sign-in (若提供第三方登入)
- [ ] 恢復購買 (Restore Purchases) 可用
- [ ] RLS 全表覆蓋、「非成員存取被擋」測試通過
- [ ] prod secrets 與 dev/staging 隔離
- [ ] Sentry/analytics 在 prod 正常回報
- [ ] 金額稽核不變量測試全綠 (見 [05 §9](05-data-model.md))
