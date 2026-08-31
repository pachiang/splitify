@AGENTS.md

# @splitify/mobile

Expo (React Native) App — iOS / Android。Expo SDK 57 + Expo Router(檔案式路由)。

> 上面 import 的 `AGENTS.md` 是 Expo 官方針對本 SDK 版本給 agent 的指引,**寫任何 Expo 相關程式碼前先讀它**。

## 結構

```
src/
├── app/          # Expo Router 路由(檔案即畫面)
├── features/     # 依功能垂直切分:groups / expenses / balances ...
├── components/   # 跨功能共用 UI(themed-text / themed-view ...)
├── hooks/        # 共用 hooks
├── lib/          # supabase client、query client 等基礎設施
└── constants/    # theme(色彩 / 間距 / 字型)
```

## 慣例

- **資料存取一律走 TanStack Query**,包成 `features/<name>/` 底下的 hook,不在畫面裡直接呼叫 supabase。
- **金額顯示一律用 `@splitify/core` 的 `formatMoney`**,不在畫面裡自己除以 100 或拼字串。
- **金額計算不在 client 做可信任的結論**;client 只顯示,權威計算在 Supabase Edge Function。
- 表單驗證用 `@splitify/shared` 的 Zod schema,不另外寫一份。
- 路徑別名:`@/*` → `src/*`,`@/assets/*` → `assets/*`。

## 環境變數

複製 `.env.example` 為 `.env.local` 並填入 Supabase 專案資訊。
只有 `EXPO_PUBLIC_` 開頭的變數會進到 App bundle —— **service role key 等機密絕不可放這裡**。

## 指令

```bash
pnpm --filter @splitify/mobile dev          # expo start
pnpm --filter @splitify/mobile ios          # 開 iOS 模擬器
pnpm --filter @splitify/mobile type-check
```
