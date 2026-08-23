import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { accountDisplayIcon } from "@/components/account/utils";
import { Icon } from "@/components/ui/icon";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

import type { AccountRowProps } from "./types";

export function AccountRow({ account, onPress }: AccountRowProps) {
  const typeMeta = ACCOUNT_TYPE_META[account.type];

  return (
    <Pressable
      aria-label={account.lifecycle === "archived" ? `${account.name}, Archived` : account.name}
      role="button"
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 gap-3 bg-surface-container active:bg-surface-dim"
    >
      <View
        style={{ backgroundColor: `${account.color}20` }}
        className="w-9 h-9 rounded-full items-center justify-center"
      >
        <Text className="text-base">{accountDisplayIcon(account)}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-base text-ink">{account.name}</Text>
        <Text className="font-body-normal text-xs text-ink/40 mt-0.5">
          {typeMeta?.label ?? account.type} · {account.currency}
        </Text>
      </View>
      {account.lifecycle === "archived" ? (
        <Text className="font-body-medium text-xs text-ink/40">Archived</Text>
      ) : null}
      <MoneyText
        cents={Math.abs(account.balance)}
        currency={account.currency}
        sign={account.balance < 0 ? "-" : ""}
        className={cn(
          "font-heading-normal text-base",
          account.balance < 0 ? "text-terracotta" : "text-ink",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      />
      <Icon as={CaretRightIcon} className="text-ink/20 ml-1" size={16} />
    </Pressable>
  );
}
