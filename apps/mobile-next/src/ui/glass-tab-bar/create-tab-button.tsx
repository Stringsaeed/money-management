import { Pressable, View } from "react-native";
import { useRef } from "react";

import { Icon } from "@/ui/icon";
// import { useAccounts } from "@/hooks/use-accounts";

import { GlassSurface } from "./glass-surface";
import { styles } from "./styles";

interface CreateTabButtonProps {
  readonly onPress?: () => void;
  readonly onLongPress?: () => void;
  readonly accessibilityLabel?: string;
}

export function CreateTabButton({
  onPress,
  onLongPress,
  accessibilityLabel = "Create",
}: CreateTabButtonProps) {
  const longPressed = useRef(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onLongPress={() => {
        longPressed.current = true;
        onLongPress?.();
      }}
      onPress={() => {
        if (longPressed.current) return;
        onPress?.();
      }}
      onPressOut={() => {
        longPressed.current = false;
      }}
      delayLongPress={350}
      style={styles.createPressable}
    >
      <GlassSurface style={styles.create}>
        <Icon name="plus" size={26} weight="bold" style={styles.createIcon} />
        <View pointerEvents="none" style={styles.insetShadow} />
      </GlassSurface>
    </Pressable>
  );
}
