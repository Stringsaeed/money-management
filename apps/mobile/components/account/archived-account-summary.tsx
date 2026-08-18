import Animated, { FadeIn } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AccountWithBalance } from "@/types";

import { AccountFormPreview } from "./account-form-preview";
import { accountDisplayIcon } from "./utils";

interface ArchivedAccountSummaryProps {
  account: AccountWithBalance;
}

export function ArchivedAccountSummary({ account }: ArchivedAccountSummaryProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} layout={layoutTransition} className="gap-3">
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
      <Text className="font-body-normal text-sm text-ink/60">
        Restore this Account before editing its details. Its archived currency and type stay fixed
        to protect historical transactions and budget projections.
      </Text>
    </Animated.View>
  );
}
