import { frame } from "@expo/ui/swift-ui/modifiers";
import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/**
 * Size auth controls to the sheet's offered width.
 * Horizontal fill comes from BottomSheet `contentPadding` plus the parent Column.
 * `maxWidth: Infinity` matches Expo UI's own stretch idiom for frame.
 */
export function stretchHorizontal(height?: number): ModifierConfig[] {
  const modifiers: ModifierConfig[] = [frame({ maxWidth: Infinity })];
  if (height != null) {
    modifiers.push(frame({ height }));
  }
  return modifiers;
}
