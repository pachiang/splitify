# Splitify

跨平台 (iOS / Android) 分帳 App,對標 Splitwise,freemium 模式。詳細規劃見 [`docs/`](docs/README.md)。

> **現況**:Phase 0 進行中。Monorepo 骨架 + `packages/{config,shared,core}` 已建好且**測試綠燈** (`pnpm test` / `type-check` / `lint` 全過,共 31 個測試)。**尚未建立**:`apps/mobile` (Expo App)、`supabase/` (migrations + functions)、CI。開始寫程式前請先讀 `docs/` 對應文件。

## 技術棧 (已定案)

- **手機端**:Expo (React Native) + TypeScript + Expo Router
- **後端平台**:Supabase (Postgres / Auth / Realtime / Storage / Edge Functions)
- **Monorepo**:pnpm workspaces + Turborepo
- **付費**:RevenueCat + App Store / Google Play 內購 (IAP)

## 規劃中的專案結構

```
splitify/
├── apps/mobile/          # Expo App
├── packages/
│   ├── core/             # 純 TS 商業邏輯 (拆帳/餘額/結算),前後端共用、可獨立測試
│   ├── shared/           # 型別 + Zod schema (單一真相來源)
│   └── config/           # tsconfig / eslint / prettier 共用設定
├── supabase/
│   ├── migrations/       # DB schema + RLS policies
│   └── functions/        # Edge Functions (Deno / TS)
├── docs/                 # 規劃文件 (見 docs/README.md)
└── (turbo.json / pnpm-workspace.yaml — 尚未建立)
```

## 開發鐵則 (務必遵守)

1. **金額用整數最小單位 (minor units) 儲存與運算**,禁用 float。
2. **金額計算伺服器權威**;client 只做顯示,不做可信任的金額結論。
3. **型別/驗證單一真相**:Zod schema 定義於 `packages/shared`,前後端 import 同一份。
4. **多租戶隔離靠 Postgres RLS**,每張含使用者資料的表都要有 policy。
5. **TypeScript strict**;新程式碼要附測試 (核心拆帳/餘額邏輯尤其要有單元測試)。
6. 動到架構/資料模型/功能範圍時,回頭更新 `docs/` 對應文件。

## 常用指令

> 需 pnpm;若尚未啟用:`corepack enable`。

```bash
pnpm install         # 安裝相依
pnpm test            # 全部測試 (turbo)
pnpm type-check      # 型別檢查 (turbo)
pnpm lint            # Biome lint + format 檢查
pnpm format          # Biome 自動排版
pnpm --filter @splitify/core test   # 只測 core
```

## 進一步

- 產品範圍與功能分級:[docs/01-prd.md](docs/01-prd.md)
- 架構與資料流:[docs/04-architecture.md](docs/04-architecture.md)
- 資料模型與演算法:[docs/05-data-model.md](docs/05-data-model.md)
- 用 agent 開發此專案的慣例:[docs/08-agent-workflow.md](docs/08-agent-workflow.md)
