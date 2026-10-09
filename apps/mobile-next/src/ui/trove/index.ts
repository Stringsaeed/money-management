// Trove design system v0.2 · Receipt — tokens and components.
// Built alongside the legacy `src/ui` kit; screens migrate to these in a later pass.

export {
  androidColorName,
  CATEGORY_KEYS,
  categoryColors,
  categoryRawColor,
  colors,
  colorToken,
  DENSE_MAX_FONT_SCALE,
  elevation,
  fonts,
  layout,
  motion,
  radius,
  space,
  troveRawColors,
  troveTransition,
  type,
} from "./tokens";
export type {
  CategoryColor,
  CategoryKey,
  ColorMode,
  ElevationLevel,
  RawColorKey,
  TypeVariant,
} from "./tokens";
export { Amount, amountParts, CurrencySign, MINUS } from "./amount";
export type { AmountProps, AmountSize, AmountTone, CurrencySignProps, SignDisplay } from "./amount";
export { Icon } from "./icon";
export type { CategoryIconName, IconName, IconProps, NavIconName, UiIconName } from "./icon";
export { PressableScale } from "./pressable-scale";
export type { PressableScaleProps } from "./pressable-scale";
export { Text } from "./text";
export type { TextProps, TextTone } from "./text";
