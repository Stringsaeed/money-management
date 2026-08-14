import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { decimalStringToCents } from "@/utils/currency";

import type { AccountFormValues } from "./form";

interface AccountFormPreviewProps {
  lockedBalanceCents?: number;
  values: AccountFormValues;
}

export function AccountFormPreview({ lockedBalanceCents, values }: AccountFormPreviewProps) {
  const meta = ACCOUNT_TYPE_META[values.type];
  const displayName =
    values.name.trim() || (lockedBalanceCents == null ? "New account" : "Account");
  const balanceCents = lockedBalanceCents ?? decimalStringToCents(values.amount);
  const isNegative = balanceCents < 0;
  const icon = values.icon || meta.emoji;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={layoutTransition}
      className="rounded-3xl border border-ledger-outline bg-surface-container px-4 py-3.5"
    >
      <View className="flex-row items-center gap-3">
        <Animated.View
          layout={layoutTransition}
          style={{ backgroundColor: `${values.color}20` }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Text className="text-base">{icon}</Text>
        </Animated.View>
        <View className="min-w-0 flex-1">
          <Animated.View
            key={displayName}
            entering={FadeIn.duration(150)}
            layout={layoutTransition}
          >
            <Text className="font-body-medium text-base text-ink" numberOfLines={1}>
              {displayName}
            </Text>
          </Animated.View>
          <Text className="mt-0.5 font-body-normal text-xs text-ink/40">
            {meta.label} · {values.currency}
          </Text>
        </View>
        <MoneyText
          cents={Math.abs(balanceCents)}
          currency={values.currency}
          sign={isNegative ? "-" : ""}
          className={cn(
            "font-heading-normal text-base italic",
            isNegative ? "text-terracotta" : "text-ink",
          )}
          style={{ fontVariant: ["tabular-nums"] }}
        />
      </View>
    </Animated.View>
  );
}
