import { XIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import { styles } from "./styles";

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.filterChip}>
      <Text style={styles.filterChipLabel}>{label}</Text>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.filterChipButton}>
        <Icon as={XIcon} size={10} style={styles.filterChipIcon} />
      </Pressable>
    </View>
  );
}
