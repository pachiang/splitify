// Expo 會在 `expo start` 時生成 expo-env.d.ts 提供這些宣告,但該檔案不進版控
// (CI 上不存在),因此在這裡自行宣告,讓 type-check 不依賴生成檔。
declare module "*.css";
