import type { UniversalBaseProps, UniversalStyle, UniversalTextStyle } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

export interface NativeRecipe {
  readonly style?: UniversalStyle;
  readonly textStyle?: UniversalTextStyle;
  readonly modifiers?: readonly ModifierConfig[];
}

export interface NativeControlRecipe {
  readonly control: NativeRecipe;
  readonly label: NativeRecipe;
}
