import { useRouter } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

import { GlassSurface } from "./glass-surface";
import { styles } from "./styles";

export function CreateTabButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create transaction"
      onPress={() => router.push("/transaction/new")}
      className="size-14.5 items-center justify-center rounded-full"
    >
      <GlassSurface style={styles.create}>
        <Icon as={PlusIcon} size={26} weight="bold" className="text-foreground" />
      </GlassSurface>
    </Pressable>
  );
}
