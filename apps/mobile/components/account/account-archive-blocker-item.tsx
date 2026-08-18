import { router } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import type { AccountArchiveBlocker } from "@/modules/accounts/account-lifecycle";
import type { AccountWithBalance } from "@/types";

interface AccountArchiveBlockerItemProps {
  account: AccountWithBalance;
  blocker: AccountArchiveBlocker;
}

export function AccountArchiveBlockerItem({ account, blocker }: AccountArchiveBlockerItemProps) {
  function reviewBalance() {
    router.push("/(tabs)/ledger");
  }

  function reviewBudget() {
    router.push("/(tabs)/envelopes");
  }

  function reviewRules() {
    router.push("/recurring");
  }

  if (blocker.kind === "non-zero-balance") {
    return (
      <View className="gap-2">
        <Text className="font-body-normal text-sm text-ink/70">
          Balance must be zero. Current balance:{" "}
          <MoneyText
            cents={Math.abs(blocker.balanceMinor)}
            currency={account.currency}
            sign={blocker.balanceMinor < 0 ? "-" : ""}
          />
        </Text>
        <Text className="font-body-normal text-xs text-ink/50">{blocker.recoveryAction}</Text>
        <Button
          aria-label={`Review ${account.name} balance`}
          onPress={reviewBalance}
          size="lg"
          variant="outline"
        >
          <Text>Review Balance</Text>
        </Button>
      </View>
    );
  }

  if (blocker.kind === "active-recurring-rules") {
    return (
      <View className="gap-2">
        <Text className="font-body-normal text-sm text-ink/70">
          Active Recurring Rules: {blocker.rules.map((rule) => rule.name).join(", ")}
        </Text>
        <Text className="font-body-normal text-xs text-ink/50">{blocker.recoveryAction}</Text>
        <Button
          aria-label="Review blocking Recurring Rules"
          onPress={reviewRules}
          size="lg"
          variant="outline"
        >
          <Text>Review Recurring Rules</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Text className="font-body-normal text-sm text-ink/70">
        Budget Shortfall:{" "}
        {blocker.dependencies.map((dependency) => (
          <MoneyText
            cents={dependency.amountMinor}
            currency={dependency.currency}
            key={dependency.currency}
          />
        ))}
      </Text>
      <Text className="font-body-normal text-xs text-ink/50">{blocker.recoveryAction}</Text>
      <Button
        aria-label="Review blocking budget dependencies"
        onPress={reviewBudget}
        size="lg"
        variant="outline"
      >
        <Text>Review Budget</Text>
      </Button>
    </View>
  );
}
