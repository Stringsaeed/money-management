import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PlusIcon } from "phosphor-react-native";

import { AccountFormBottomSheet } from "@/components/account/account-form-sheet";
import { CoinPlantGraphic } from "@/components/graphics/coin-plant";
import { AccountRow } from "@/components/settings/account-row";
import { Card } from "@/components/settings/card";
import { Divider } from "@/components/settings/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AccountsScreen() {
  const colorScheme = useColorScheme();
  const { data: accounts = [] } = useAccountsWithBalances();

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
          <Card animated>
            {accounts.map((account, i) => (
              <Animated.View key={account.id} entering={FadeIn} exiting={FadeOut}>
                {i > 0 && <Divider />}
                <AccountRow account={account} />
              </Animated.View>
            ))}
          </Card>
        )}
      </ScrollView>

      <AccountFormBottomSheet>
        <Pressable
          style={{
            position: "absolute",
            bottom: 32,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 8px ${colorScheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"}`,
          }}
          className="bg-brand"
        >
          <Icon as={PlusIcon} size={24} className="text-white" />
        </Pressable>
      </AccountFormBottomSheet>
    </View>
  );
}
