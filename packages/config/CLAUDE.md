# @splitify/config

跨 package 共用的基礎設定。目前提供 `tsconfig.base.json`,各 package 以相對路徑 extends:

```jsonc
// packages/<name>/tsconfig.json
{ "extends": "../config/tsconfig.base.json", "include": ["src"] }
```

Biome (lint + format) 的設定放在 repo 根目錄 `biome.json`,單一設定涵蓋整個 monorepo,不在此重複。

新增共用設定時放這裡,並更新本檔說明。
