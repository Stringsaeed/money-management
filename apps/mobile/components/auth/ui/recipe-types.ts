import type { UniversalBaseProps, UniversalStyle, UniversalTextStyle } from "@expo/ui";

type ModifierConfig = NonNullable<UniversalBaseProps["modifiers"]>[number];

export interface AuthRecipe {
  readonly style?: UniversalStyle;
  readonly textStyle?: UniversalTextStyle;
  readonly modifiers?: readonly ModifierConfig[];
}

export interface AuthControlRecipe {
  readonly control: AuthRecipe;
  readonly label: AuthRecipe;
}
