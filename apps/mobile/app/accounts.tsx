import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PlusIcon } from "phosphor-react-native";

import { AccountEditSheet } from "@/components/account/account-edit-sheet";
import { AccountFormBottomSheet } from "@/components/account/account-form-sheet";
import { CoinPlantGraphic } from "@/components/graphics/coin-plant";
import { Card } from "@/components/settings/card";
import { Divider } from "@/components/settings/divider";
import { AccountRow } from "@/components/settings/account-row";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { useAllAccountsWithBalances } from "@/hooks/use-accounts";
import type { AccountWithBalance } from "@/types";

export default function AccountsScreen() {
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const { data: accounts = [] } = useAllAccountsWithBalances();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CoinPlantGraphic />
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first account.</Text>
          </View>
        ) : (
          <Card animated clipContent>
            {accounts.map((account, i) => (
              <Animated.View
                key={account.id}
                entering={FadeIn}
                exiting={FadeOut}
                layout={layoutTransition}
              >
                {i > 0 && <Divider />}
                <AccountRow account={account} onPress={() => setEditingAccount(account)} />
              </Animated.View>
            ))}
          </Card>
        )}
      </ScrollView>

      <AccountFormBottomSheet>
        <Button size="fab">
          <Icon as={PlusIcon} size={24} />
        </Button>
      </AccountFormBottomSheet>
      {editingAccount ? (
        <AccountEditSheet
          account={editingAccount}
          onDismiss={() => setEditingAccount(null)}
          onUpdated={() => setEditingAccount(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[2],
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontStyle: "italic",
    fontSize: typography.textLg,
    color: colors.ink,
  },
  emptySubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
    textAlign: "center",
  },
});
