import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PlusIcon } from "phosphor-react-native";

import { AccountEditSheet } from "@/components/account/account-edit-sheet";
import { CoinPlantGraphic } from "@/components/graphics/coin-plant";
import { Card } from "@/components/settings/card";
import { Divider } from "@/components/settings/divider";
import { AccountRow } from "@/components/settings/account-row";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAllAccountsWithBalances } from "@/hooks/use-accounts";
import type { AccountWithBalance } from "@/types";

export default function AccountsScreen() {
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const { data: accounts = [] } = useAllAccountsWithBalances();

  return (
    <View className="flex-1 bg-surface safe-bottom">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-safe-offset-32 pt-2"
      >
        {accounts.length === 0 ? (
          <View className="items-center py-16 px-8 gap-2">
            <CoinPlantGraphic />
            <Text className="font-heading-normal italic text-lg text-ink">No accounts yet</Text>
            <Text className="font-body-normal text-sm text-ink/50 text-center">
              Tap the + button to add your first account.
            </Text>
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

      <Button
        accessibilityLabel="Add Account"
        onPress={() => router.push("/account/new")}
        size="fab"
        testID="add-account"
      >
        <Icon as={PlusIcon} size={24} />
      </Button>
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
