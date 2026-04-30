import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";
import type { AccountType } from "@/types";

import { ACCOUNT_TYPE_META } from "./account-form-options";

interface AccountPreviewCardProps {
  balanceCents: number;
  color: string;
  currency: string;
  name: string;
  type: AccountType;
}

export function AccountPreviewCard({
  balanceCents,
  color,
  currency,
  name,
  type,
}: AccountPreviewCardProps) {
  const meta = ACCOUNT_TYPE_META[type];
  const displayName = name.trim() || "Untitled account";

  return (
    <View className="overflow-hidden rounded-3xl bg-ink px-5 py-5">
      <View className="flex-row items-start justify-between gap-3">
        <View
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}33` }}
        >
          <Text className="text-2xl">{meta.emoji}</Text>
        </View>
        <View
          className="rounded-full border px-3 py-1"
          style={{ backgroundColor: `${color}22`, borderColor: `${color}55` }}
        >
          <Text className="font-body-medium text-xs text-surface">{meta.label}</Text>
        </View>
      </View>

      <View className="mt-10 gap-1">
        <Text className="font-body-medium text-xs uppercase tracking-wide text-surface/55">
          Account preview
        </Text>
        <Text className="font-heading-medium text-3xl italic text-surface">{displayName}</Text>
        <Text className="font-body-normal text-sm text-surface/70">{currency} ledger</Text>
      </View>

      <View className="mt-8 flex-row items-end justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="font-body-medium text-xs uppercase tracking-wide text-surface/55">
            Opening balance
          </Text>
          <Text
            className="font-heading-normal text-2xl italic text-surface"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatCents(balanceCents, currency)}
          </Text>
        </View>
        <View className="rounded-full bg-surface/10 px-3 py-2">
          <Text className="font-body-medium text-xs text-surface/70">Included in totals ✅</Text>
        </View>
      </View>
    </View>
  );
}
