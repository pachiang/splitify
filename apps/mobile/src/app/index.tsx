import { computeSplits, formatMoney } from "@splitify/core";
import { DEFAULT_CURRENCY } from "@splitify/shared";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { isSupabaseConfigured } from "@/lib/supabase";

// Phase 0 健康檢查:證明 App 能正確使用 @splitify/core 的拆帳邏輯。
const DEMO_TOTAL = 1000;
const DEMO_MEMBERS = ["小明", "小美", "阿華"];
const demoSplits = computeSplits(DEMO_TOTAL, DEMO_MEMBERS, { type: "equal" });

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Splitify</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Phase 0 骨架
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">
            {formatMoney(DEMO_TOTAL, DEFAULT_CURRENCY)} 三人均分
          </ThemedText>
          {demoSplits.map((split) => (
            <ThemedText key={split.memberId} type="small">
              {split.memberId} — {formatMoney(split.owed, DEFAULT_CURRENCY)}
            </ThemedText>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            合計{" "}
            {formatMoney(
              demoSplits.reduce((sum, s) => sum + s.owed, 0),
              DEFAULT_CURRENCY,
            )}
            (必須等於總額)
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Supabase</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isSupabaseConfigured
              ? "已設定連線"
              : "尚未設定 — 複製 .env.example 為 .env.local 並填入專案資訊"}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
