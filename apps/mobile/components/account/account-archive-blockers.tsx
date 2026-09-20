import type { Href } from "expo-router";
import { StyleSheet, useColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { AccountArchiveBlocker } from "@/modules/accounts/account-lifecycle";
import type { AccountWithBalance } from "@/types";

import { AccountArchiveBlockerItem } from "./account-archive-blocker-item";

interface AccountArchiveBlockersProps {
  account: AccountWithBalance;
  blockers: AccountArchiveBlocker[];
  onReview: (href: Href) => void;
}

export function AccountArchiveBlockers({
  account,
  blockers,
  onReview,
}: AccountArchiveBlockersProps) {
  const colorScheme = useColorScheme();
  const terracottaHex =
    colorScheme === "dark" ? rawColorValues.dark.terracotta : rawColorValues.light.terracotta;

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: `${terracottaHex}4D`, backgroundColor: `${terracottaHex}1A` },
      ]}
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
    >
      <Text role="alert" style={styles.alertText}>
        Resolve every prerequisite before archiving
      </Text>
      {blockers.map((blocker) => (
        <AccountArchiveBlockerItem
          account={account}
          blocker={blocker}
          key={blocker.kind}
          onReview={onReview}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[4],
  },
  alertText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.terracotta,
  },
});
