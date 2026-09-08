import { frame } from "@expo/ui/swift-ui/modifiers";
import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/**
 * Stretch native controls to the offered width (card / form column).
 * `maxWidth: Infinity` matches Expo UI's stretch idiom for frame.
 */
export function stretchHorizontal(height?: number): ModifierConfig[] {
  const modifiers: ModifierConfig[] = [frame({ maxWidth: Infinity })];
  if (height != null) {
    modifiers.push(frame({ height }));
  }
  return modifiers;
}
