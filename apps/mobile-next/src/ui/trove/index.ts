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
export {
  AmountInput,
  Button,
  Checkbox,
  formatAmountDisplay,
  IconButton,
  QuickAction,
  quickPickLabel,
  sanitizeAmountInput,
  SearchField,
  Switch,
  TextField,
} from "./controls";
export type {
  AmountInputProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  CheckboxProps,
  IconButtonProps,
  IconButtonVariant,
  QuickActionProps,
  SearchFieldProps,
  SwitchProps,
  TextFieldProps,
} from "./controls";
export {
  applyKeypadKey,
  BalanceCard,
  Card,
  CategoryTile,
  DeltaBadge,
  deltaPercentAccessibilityLabel,
  deltaToneForPercent,
  formatDeltaPercent,
  formatKeypadValue,
  Keypad,
  keypadValueToMinor,
  ListGroup,
  ListRow,
  localeDecimalSeparator,
  SectionHeader,
  TransactionRow,
} from "./data";
export type {
  BalanceCardProps,
  CardProps,
  CategoryTileProps,
  CategoryTileSize,
  DeltaBadgeProps,
  DeltaTone,
  KeypadDigit,
  KeypadKey,
  KeypadLimits,
  KeypadProps,
  ListGroupProps,
  ListRowProps,
  PercentTone,
  SectionHeaderProps,
  TransactionRowProps,
} from "./data";
export { Chip, Header, SegmentedControl, Sheet } from "./navigation";
export type {
  ChipProps,
  CompactHeaderProps,
  HeaderAction,
  HeaderProps,
  LargeHeaderProps,
  SegmentedControlProps,
  SegmentOption,
  SheetProps,
} from "./navigation";
export {
  Banner,
  Dialog,
  EmptyState,
  hideToast,
  showToast,
  Skeleton,
  Toast,
  ToastHost,
} from "./feedback";
export type {
  BannerProps,
  BannerTone,
  DialogProps,
  EmptyStateProps,
  SkeletonProps,
  ToastHostProps,
  ToastOptions,
  ToastProps,
} from "./feedback";
export { BalanceChart, CategoryBreakdown, ColumnChart, foldCategories, StatTile } from "./charts";
export type {
  BalanceChartDatum,
  BalanceChartProps,
  CategoryAmount,
  CategoryBreakdownProps,
  CategorySlice,
  ColumnChartDatum,
  ColumnChartProps,
  StatTileProps,
} from "./charts";
export { TabBar } from "./tab-bar";
export type { TabBarKey, TabBarProps, TabBarTab } from "./tab-bar";
