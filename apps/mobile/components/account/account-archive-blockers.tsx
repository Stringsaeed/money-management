import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AccountArchiveBlocker } from "@/modules/accounts/account-lifecycle";
import type { AccountWithBalance } from "@/types";

import { AccountArchiveBlockerItem } from "./account-archive-blocker-item";

interface AccountArchiveBlockersProps {
  account: AccountWithBalance;
  blockers: AccountArchiveBlocker[];
}

export function AccountArchiveBlockers({ account, blockers }: AccountArchiveBlockersProps) {
  return (
    <Animated.View
      className="gap-3 rounded-xl border border-terracotta/30 bg-terracotta/10 p-4"
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
    >
      <Text role="alert" className="font-body-semibold text-sm text-terracotta">
        Resolve every prerequisite before archiving
      </Text>
      {blockers.map((blocker) => (
        <AccountArchiveBlockerItem account={account} blocker={blocker} key={blocker.kind} />
      ))}
    </Animated.View>
  );
}
