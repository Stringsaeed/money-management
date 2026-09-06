import { frame } from "@expo/ui/swift-ui/modifiers";
import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/** Stretch auth columns to the ScrollView's offered width. */
export function shellColumnModifiers(): readonly ModifierConfig[] {
  return [frame({ maxWidth: Infinity })];
}
