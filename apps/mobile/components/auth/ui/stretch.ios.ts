import { containerRelativeFrame, frame } from "@expo/ui/swift-ui/modifiers";
import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/**
 * Fill the offered horizontal width without `frame({ maxWidth: Infinity })`.
 * JSON serialization turns Infinity into null, so the native FrameModifier
 * never receives .infinity and controls hug their label instead of stretching.
 */
export function stretchHorizontal(height?: number): ModifierConfig[] {
  const modifiers: ModifierConfig[] = [containerRelativeFrame({ axes: "horizontal" })];
  if (height != null) {
    modifiers.push(frame({ height }));
  }
  return modifiers;
}
