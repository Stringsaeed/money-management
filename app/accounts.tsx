import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PlusIcon } from "phosphor-react-native";

import { AccountFormBottomSheet } from "@/components/account/account-form-sheet";
import { CoinPlantGraphic } from "@/components/graphics/coin-plant";
import { Card } from "@/components/settings/card";
import { Divider } from "@/components/settings/divider";
import { SwipeableAccountRow } from "@/components/settings/swipeable-account-row";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAccountsWithBalances, useDeleteAccount } from "@/hooks/use-accounts";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AccountsScreen() {
  const colorScheme = useColorScheme();
  const { data: accounts = [] } = useAccountsWithBalances();
  const deleteAccount = useDeleteAccount();

  return (
    <View className="flex-1 bg-surface">
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
                <SwipeableAccountRow account={account} onDelete={deleteAccount.mutateAsync} />
              </Animated.View>
            ))}
          </Card>
        )}
      </ScrollView>

      <AccountFormBottomSheet>
        <Button
          size="fab"
          style={{
            position: "absolute",
            bottom: 32,
            right: 20,
            boxShadow: `0 4px 8px ${colorScheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"}`,
          }}
        >
          <Icon as={PlusIcon} size={24} />
        </Button>
      </AccountFormBottomSheet>
    </View>
  );
}
