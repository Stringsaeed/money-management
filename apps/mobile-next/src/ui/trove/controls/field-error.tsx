import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { Icon } from "../icon";
import { Text } from "../text";
import { colors, motion, space, troveTransition } from "../tokens";

interface FieldErrorProps {
  message: string;
}

/** Inline error under a field: warning glyph plus the message, fading in. */
export function FieldError({ message }: FieldErrorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <EaseView
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.row}>
        <Icon color={colors.negative.text} name="warning" size={16} />
        <Text style={styles.message} tone="negative" variant="bodySm">
          {message}
        </Text>
      </View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[1] + space[0.5] },
  message: { flex: 1 },
});
