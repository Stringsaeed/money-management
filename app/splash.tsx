import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { Redirect } from "expo-router";
import Animated from "react-native-reanimated";

export default function Splash() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();

  if (loadingAccounts) {
    return (
      <Animated.View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Animated.Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Money Management
        </Animated.Text>
      </Animated.View>
    );
  }

  if (!__DEV__ && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
