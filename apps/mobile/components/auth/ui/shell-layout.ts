import type { UniversalBaseProps } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/** Web/Jest: ScrollView already stretches; no native max-width modifier. */
export function shellColumnModifiers(): readonly ModifierConfig[] {
  return [];
}
