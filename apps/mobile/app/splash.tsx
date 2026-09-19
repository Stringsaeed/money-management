import { StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import Animated from "react-native-reanimated";

import { useAllAccountsWithBalances } from "@/hooks/use-accounts";
import { ONBOARDING_ENABLED } from "@/constants/onboarding";
import { colors, typography } from "@/lib/design-tokens";

export default function Splash() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAllAccountsWithBalances();

  if (loadingAccounts) {
    return (
      <Animated.View style={styles.container}>
        <Animated.Text style={styles.title}>Money Management</Animated.Text>
      </Animated.View>
    );
  }

  if (ONBOARDING_ENABLED && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.text2xl,
    fontFamily: typography.fontBodyBold,
    color: colors.foreground,
  },
});
