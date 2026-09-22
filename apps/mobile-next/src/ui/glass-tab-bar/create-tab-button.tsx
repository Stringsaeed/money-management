import Gradient from "react-native-linear-gradient";
import { EaseView } from "react-native-ease";
import { Pressable, View } from "react-native";
import { useRef } from "react";
import type { SingleTransition } from "react-native-ease";

import { Icon } from "@/ui/icon";
import { motionTransition, useReducedMotion } from "@/ui/motion";

import { createBlobStyles, createBlobTokens } from "./create-tab-button.styles";
import { styles } from "./styles";

const CREATE_PRESS_TRANSITION: SingleTransition = {
  type: "spring",
  damping: 18,
  stiffness: 220,
  mass: 0.8,
};

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
  const reducedMotion = useReducedMotion();

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
      {({ pressed }) => (
        <EaseView
          animate={{
            opacity: pressed ? 0.92 : 1,
            scaleX: pressed && !reducedMotion ? 1.04 : 1,
            scaleY: pressed && !reducedMotion ? 0.94 : 1,
            translateY: pressed && !reducedMotion ? 1.5 : 0,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, CREATE_PRESS_TRANSITION)}
          style={createBlobStyles.motion}
        >
          <View pointerEvents="none" style={createBlobStyles.art}>
            <View style={createBlobStyles.underside}>
              <Gradient
                colors={createBlobTokens.underside}
                end={{ x: 0.86, y: 1 }}
                start={{ x: 0.18, y: 0 }}
                style={createBlobStyles.fill}
              />
            </View>
            <View style={createBlobStyles.face}>
              <Gradient
                colors={createBlobTokens.face}
                end={{ x: 0.82, y: 1 }}
                start={{ x: 0.18, y: 0 }}
                style={createBlobStyles.fill}
              />
              <View style={createBlobStyles.gloss}>
                <Gradient
                  colors={createBlobTokens.gloss}
                  end={{ x: 0.82, y: 0.7 }}
                  start={{ x: 0.12, y: 0.15 }}
                  style={createBlobStyles.fill}
                />
              </View>
              <View style={createBlobStyles.highlightRing} />
            </View>
            <Icon name="plus" size={26} weight="bold" style={createBlobStyles.plus} />
          </View>
        </EaseView>
      )}
    </Pressable>
  );
}
