import type { Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccountArchiveBlocker } from "@/modules/accounts/account-lifecycle";
import { useUIStore } from "@/stores/ui-store";
import type { AccountWithBalance } from "@/types";

interface AccountArchiveBlockerItemProps {
  account: AccountWithBalance;
  blocker: AccountArchiveBlocker;
  onReview: (href: Href) => void;
}

const BUDGET_DEPENDENCY_LABELS = {
  "budget-shortfall": "Budget Shortfall",
  "cash-envelope-overspending": "Cash Envelope Overspending",
  "card-payment-reserve": "Card Payment Reserve",
  "unfunded-card-spending": "Unfunded Card Spending",
  "unsupported-cross-currency-transfer": "Unsupported Cross-currency Transfer",
} as const;

export function AccountArchiveBlockerItem({
  account,
  blocker,
  onReview,
}: AccountArchiveBlockerItemProps) {
  const setActiveAccountId = useUIStore((state) => state.setActiveAccountId);

  function reviewBalance() {
    setActiveAccountId(account.id);
    onReview("/(tabs)/ledger");
  }

  function reviewBudget() {
    onReview("/(tabs)/envelopes");
  }

  function reviewRules() {
    onReview("/recurring");
  }

  if (blocker.kind === "non-zero-balance") {
    return (
      <View style={styles.container}>
        <Text style={styles.bodyText}>
          Balance must be zero. Current balance:{" "}
          <MoneyText
            cents={Math.abs(blocker.balanceMinor)}
            currency={account.currency}
            sign={blocker.balanceMinor < 0 ? "-" : ""}
          />
        </Text>
        <Text style={styles.hintText}>{blocker.recoveryAction}</Text>
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
      <View style={styles.container}>
        <Text style={styles.bodyText}>
          Active Recurring Rules: {blocker.rules.map((rule) => rule.name).join(", ")}
        </Text>
        <Text style={styles.hintText}>{blocker.recoveryAction}</Text>
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

  const hasCardDependency = blocker.dependencies.some(
    (dependency) =>
      dependency.kind === "card-payment-reserve" || dependency.kind === "unfunded-card-spending",
  );
  const hasBudgetDependency = blocker.dependencies.some(
    (dependency) =>
      dependency.kind === "budget-shortfall" || dependency.kind === "cash-envelope-overspending",
  );
  const hasLedgerDependency = blocker.dependencies.some(
    (dependency) => dependency.kind === "unsupported-cross-currency-transfer",
  );

  return (
    <View style={styles.container}>
      {blocker.dependencies.map((dependency) => (
        <View
          style={styles.dependencyItem}
          key={`${dependency.kind}:${dependency.currency}:${"transactionId" in dependency ? dependency.transactionId : "summary"}`}
        >
          <Text style={styles.bodyText}>
            {BUDGET_DEPENDENCY_LABELS[dependency.kind]}:{" "}
            <MoneyText cents={dependency.amountMinor} currency={dependency.currency} />
          </Text>
          <Text style={styles.hintText}>{dependency.recoveryAction}</Text>
        </View>
      ))}
      <Text style={styles.hintText}>{blocker.recoveryAction}</Text>
      {hasBudgetDependency ? (
        <Button
          aria-label="Review blocking budget dependencies"
          onPress={reviewBudget}
          size="lg"
          variant="outline"
        >
          <Text>Review Budget</Text>
        </Button>
      ) : null}
      {hasCardDependency ? (
        <Button
          aria-label="Review blocking card activity"
          onPress={reviewBalance}
          size="lg"
          variant="outline"
        >
          <Text>Review Card Activity</Text>
        </Button>
      ) : null}
      {hasLedgerDependency ? (
        <Button
          aria-label="Review unsupported cross-currency Transfers"
          onPress={reviewBalance}
          size="lg"
          variant="outline"
        >
          <Text>Review Transfers</Text>
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  dependencyItem: {
    gap: spacing[1],
  },
  bodyText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.7,
  },
  hintText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
});
