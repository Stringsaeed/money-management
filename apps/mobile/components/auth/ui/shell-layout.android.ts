import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

export function shellColumnModifiers(): readonly ModifierConfig[] {
  return [fillMaxWidth()];
}
