import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { Redirect } from "expo-router";
import Animated from "react-native-reanimated";

export default function Splash() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();

  if (loadingAccounts) {
    return (
      <Animated.View className="flex-1 items-center justify-center bg-background">
        <Animated.Text className="text-2xl font-bold text-foreground">
          Money Management
        </Animated.Text>
      </Animated.View>
    );
  }

  if (accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
