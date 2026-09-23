import { Pressable, View } from "react-native";

import { Icon } from "@/ui/icon";
import { GlassSurface } from "@/ui/glass-tab-bar/glass-surface";
import { styles } from "@/ui/glass-tab-bar/styles";

interface ScopeControlProps {
  readonly label: string;
  readonly onPress: () => void;
}

export function ScopeControl({ label, onPress }: ScopeControlProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ledger scope: ${label}`}
      onPress={onPress}
      style={styles.createPressable}
    >
      <GlassSurface style={styles.create}>
        <Icon name="wallet" size={26} weight="regular" style={styles.createIcon} />
        <View pointerEvents="none" style={styles.insetShadow} />
      </GlassSurface>
    </Pressable>
  );
}
