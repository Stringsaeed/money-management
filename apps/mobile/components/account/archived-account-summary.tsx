import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccountWithBalance } from "@/types";

import { AccountFormPreview } from "./account-form-preview";
import { accountDisplayIcon } from "./utils";

interface ArchivedAccountSummaryProps {
  account: AccountWithBalance;
}

export function ArchivedAccountSummary({ account }: ArchivedAccountSummaryProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={layoutTransition}
      style={styles.container}
    >
      <AccountFormPreview
        lockedBalanceCents={account.balance}
        values={{
          amount: "",
          color: account.color,
          currency: account.currency,
          icon: accountDisplayIcon(account),
          name: account.name,
          type: account.type,
        }}
      />
      <Text style={styles.infoText}>
        Restore this Account before editing its details. Its archived currency and type stay fixed
        to protect historical transactions and budget projections.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  infoText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
});
