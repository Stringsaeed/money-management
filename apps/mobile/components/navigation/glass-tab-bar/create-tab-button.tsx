import { useRouter } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { useAccounts } from "@/hooks/use-accounts";

import { GlassSurface } from "./glass-surface";
import { styles } from "./styles";

export function CreateTabButton() {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAccounts();
  const hasAccounts = accounts.length > 0;
  const accessibilityLabel = isLoading
    ? "Loading accounts"
    : hasAccounts
      ? "Create transaction"
      : "Create account";

  function handlePress() {
    if (isLoading) return;
    router.push(hasAccounts ? "/transaction/new" : "/accounts");
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={isLoading}
      onPress={handlePress}
      className="size-14 items-center justify-center rounded-full disabled:opacity-50"
    >
      <GlassSurface style={styles.create}>
        <Icon as={PlusIcon} size={26} weight="bold" className="text-foreground" />
        <View pointerEvents="none" style={styles.insetShadow} />
      </GlassSurface>
    </Pressable>
  );
}
