import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";

/** The ••• button in the header. */
export function EnvelopeMenuButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="More actions"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="dots-three" size={24} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  pressed: { opacity: 0.6 },
});
