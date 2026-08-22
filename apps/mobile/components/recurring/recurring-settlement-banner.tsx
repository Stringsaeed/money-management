import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";

import { useRecurringSettlementFeedback } from "@/components/recurring/recurring-settlement-provider";
import { Text } from "@/components/ui/text";

const SUCCESS_VISIBILITY_MS = 5000;

export function RecurringSettlementBanner() {
  const { dismiss, error, report, retry } = useRecurringSettlementFeedback();
  const unresolved =
    error !== null ||
    report?.rules.some((rule) => rule.kind === "failed" || rule.kind === "needs_attention") ===
      true;
  const showSuccess = (report?.generatedCount ?? 0) > 0;

  useEffect(() => {
    if (!showSuccess || unresolved) return;
    const timeout = setTimeout(dismiss, SUCCESS_VISIBILITY_MS);
    return () => clearTimeout(timeout);
  }, [dismiss, showSuccess, unresolved]);

  if (!unresolved && !showSuccess) return null;

  const affectedCount =
    report?.rules.filter((rule) => rule.kind === "failed" || rule.kind === "needs_attention")
      .length ?? 0;

  return (
    <View className="pointer-events-box-none absolute inset-x-4 top-safe-offset-2 z-50">
      <Animated.View
        className="gap-2 rounded-xl border border-ledger-outline bg-surface px-4 py-3 shadow-lg shadow-black/10"
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        layout={LinearTransition.duration(180)}
      >
        <View className="flex-row items-start gap-3">
          <Text className="text-lg">{unresolved ? "⚠️" : "✅"}</Text>
          <View className="flex-1 gap-0.5">
            <Text className="font-body-semibold text-sm text-ink">
              {unresolved ? "Recurring Rules need attention" : "Recurring transactions added"}
            </Text>
            <Text className="font-body-normal text-xs leading-5 text-ink/55">
              {unresolved
                ? `${affectedCount || 1} ${affectedCount === 1 ? "Rule needs" : "Rules need"} review before it can continue.`
                : `${report?.generatedCount ?? 0} scheduled ${(report?.generatedCount ?? 0) === 1 ? "transaction was" : "transactions were"} added.`}
            </Text>
          </View>
          {!unresolved ? (
            <Pressable
              accessibilityLabel="Dismiss recurring update"
              accessibilityRole="button"
              className="px-1 py-0.5 active:opacity-50"
              onPress={dismiss}
            >
              <Text className="font-body-semibold text-base text-ink/45">×</Text>
            </Pressable>
          ) : null}
        </View>
        {unresolved ? (
          <View className="flex-row justify-end gap-4">
            <Pressable
              accessibilityRole="button"
              className="py-1 active:opacity-50"
              onPress={() => void retry()}
            >
              <Text className="font-body-semibold text-xs text-ink/60">Try again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="py-1 active:opacity-50"
              onPress={() =>
                router.push({
                  pathname: "/recurring",
                  params: { filter: "needs_attention" },
                })
              }
            >
              <Text className="font-body-semibold text-xs text-terracotta">Review Rules →</Text>
            </Pressable>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
