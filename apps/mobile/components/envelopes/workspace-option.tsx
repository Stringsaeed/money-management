import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";

import { styles } from "./styles";

interface WorkspaceOptionProps {
  currency: string;
  disabled: boolean;
  selected: boolean;
  onSelect: (request: { currency: string }) => void;
}

export const WorkspaceOption = ({
  currency,
  disabled,
  selected,
  onSelect,
}: WorkspaceOptionProps) => {
  const handlePress = () => {
    if (!selected) onSelect({ currency });
  };

  return (
    <Animated.View layout={layoutTransition}>
      <Pressable
        accessibilityLabel={`${currency} currency workspace`}
        accessibilityRole="radio"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.workspaceOptionBase,
          selected ? styles.workspaceOptionSelected : styles.workspaceOptionUnselected,
          pressed && styles.envelopeRowCardPressed,
        ]}
      >
        <Text style={styles.envelopeRowTitle}>{currency}</Text>
        {selected ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
            <Text style={styles.workspaceOptionSelectedText}>Selected ✓</Text>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};
