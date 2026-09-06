import type { UniversalBaseProps } from "@expo/ui";

import { stretchHorizontal } from "./stretch.ios";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

/** Stretch auth columns to the ScrollView's offered width. */
export function shellColumnModifiers(): readonly ModifierConfig[] {
  return stretchHorizontal();
}
