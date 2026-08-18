import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { EnvelopeSummary } from "@/modules/budgeting/budgeting";
import { formatCents } from "@/utils/currency";

interface EnvelopeRowProps {
  envelope: EnvelopeSummary;
  onEdit?: (envelope: EnvelopeSummary) => void;
}

export function EnvelopeRow({ envelope, onEdit }: EnvelopeRowProps) {
  const content = (
    <>
      <View className="flex-row items-start gap-3">
        <Text className="text-xl">{envelope.icon}</Text>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-body-semibold text-base text-ink" numberOfLines={1}>
              {envelope.name}
            </Text>
            <Text
              className="font-heading-medium text-lg italic text-ink"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatCents(envelope.availableMoney.amountMinor, envelope.currency)}
            </Text>
          </View>
          <Text className="font-body-medium text-xs text-ink/50">Available Money</Text>
          <View className="flex-row gap-4">
            <Text className="font-body-normal text-xs text-ink/60">
              Assigned Money {formatCents(envelope.assignedMoney.amountMinor, envelope.currency)}
            </Text>
            <Text className="font-body-normal text-xs text-ink/60">
              Net Spent {formatCents(envelope.netSpent.amountMinor, envelope.currency)}
            </Text>
          </View>
          {envelope.health.status === "needs_attention" ? (
            <Text className="font-body-medium text-xs text-destructive">
              Needs Attention · Map an active expense Category
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
      {onEdit ? (
        <Pressable
          accessibilityLabel={`Edit ${envelope.name} Envelope`}
          accessibilityRole="button"
          className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3 active:bg-surface-dim"
          onPress={() => onEdit(envelope)}
        >
          {content}
        </Pressable>
      ) : (
        <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3">
          {content}
        </View>
      )}
    </Animated.View>
  );
}
