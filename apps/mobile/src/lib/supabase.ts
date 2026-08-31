import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 尚未填 .env.local 時為 false;畫面可據此提示「尚未設定 Supabase」,
 * 而不是讓 App 直接崩潰。
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** 把 auth session 放進 iOS Keychain / Android Keystore(web 交給預設 localStorage)。 */
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "public-anon-key-not-configured",
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      // RN 沒有網址列,不需要從 URL 解析 OAuth callback。
      detectSessionInUrl: false,
    },
  },
);
