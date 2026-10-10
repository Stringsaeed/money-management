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
export {
  Amount,
  amountAccessibilityLabel,
  amountParts,
  currencyFractionDigits,
  CurrencySign,
  decimalAmountAccessibilityLabel,
  decimalAmountParts,
  decimalSeparator,
  DEFAULT_SIGNIFICANT,
  formatDecimal,
  MINUS,
  parseDecimalString,
} from "./amount";
export type {
  AmountParts,
  AmountProps,
  AmountSize,
  AmountTone,
  CurrencyGlyphName,
  CurrencySignProps,
  DecimalAmountParts,
  FormattedDecimal,
  GlyphTone,
  SignDisplay,
} from "./amount";
export { CATEGORY_ICONS, Icon, NAV_ICONS, UI_ICONS } from "./icon";
export type { CategoryIconName, IconName, IconProps, NavIconName, UiIconName } from "./icon";
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
  DateChip,
  dateChipParts,
  DeltaBadge,
  deltaPercentAccessibilityLabel,
  deltaToneForPercent,
  dueInLabel,
  formatDeltaPercent,
  formatKeypadValue,
  Keypad,
  keypadValueToMinor,
  ListGroup,
  ListRow,
  localeDecimalSeparator,
  nextUpcomingIndex,
  SectionHeader,
  SoonBadge,
  TransactionRow,
  UpcomingRow,
} from "./data";
export type {
  BalanceCardProps,
  CardProps,
  CategoryTileProps,
  CategoryTileSize,
  DateChipParts,
  DateChipProps,
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
  SoonBadgeProps,
  TransactionRowProps,
  UpcomingRowProps,
} from "./data";
export { Chip, FilterButton, Header, SegmentedControl, Sheet } from "./navigation";
export type {
  ChipProps,
  CompactHeaderProps,
  FilterButtonProps,
  HeaderAction,
  HeaderPrimaryAction,
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
export {
  BalanceChart,
  CategoryBreakdown,
  ColumnChart,
  FlowChart,
  foldCategories,
  StatTile,
} from "./charts";
export type {
  BalanceChartDatum,
  BalanceChartProps,
  CategoryAmount,
  CategoryBreakdownProps,
  CategorySlice,
  ColumnChartDatum,
  ColumnChartProps,
  FlowChartDatum,
  FlowChartProps,
  FlowChartView,
  StatTileProps,
} from "./charts";
export { TabBar } from "./tab-bar";
export type { TabBarKey, TabBarProps, TabBarScope, TabBarTab } from "./tab-bar";
export { Screen } from "./layout";
export type { ScreenProps } from "./layout";
export { Avatar, avatarAccessibilityLabel, initialsFor } from "./identity";
export type { AvatarProps, AvatarScope, AvatarSize } from "./identity";
export {
  CategoryPreview,
  CurrencyBadge,
  currencyName,
  EmojiGrid,
  findSwatch,
  isSameColor,
  KIND_ICON,
  normalizeHex,
  resolveUserColor,
  SwatchPicker,
  SYSTEM_KINDS,
  useColorMode,
  USER_COLOR_SWATCHES,
  USER_TINT_ALPHA,
  useUserColor,
  withAlpha,
} from "./category";
export type {
  CategoryPreviewProps,
  CurrencyBadgeProps,
  CurrencyBadgeSize,
  EmojiGridProps,
  EmojiOption,
  SwatchPickerProps,
  SystemKind,
  UserColor,
  UserColorSwatch,
} from "./category";
export {
  MarketChangeBadge,
  marketChangeLabel,
  MarketRow,
  MarketSparkline,
  sparklinePath,
} from "./market";
export type { MarketChangeBadgeProps, MarketRowProps, MarketSparklineProps } from "./market";
export {
  Breadcrumb,
  EditorHeader,
  EntryAmount,
  entryLayout,
  entrySize,
  localeGroupSeparator,
  NoteField,
  OptionTile,
  OptionTileGrid,
} from "./editor";
export type {
  BreadcrumbProps,
  BreadcrumbSegmentSpec,
  BreadcrumbSegmentState,
  EditorHeaderProps,
  EntryAmountProps,
  EntryLayout,
  EntrySize,
  NoteFieldProps,
  OptionTileGridProps,
  OptionTileProps,
} from "./editor";
export {
  DateSheet,
  KeyboardDoneBar,
  KeyboardDoneBarToolbar,
  keyboardNeedsDoneBar,
  keyFromPickerValue,
  parseDateKey,
  pickerValueFromKey,
  quickDateChips,
  REPEAT_RULES,
  repeatChoices,
  RepeatOptions,
  repeatSentence,
  Slider,
  toDateKey,
  useKeyboardAccessory,
} from "./pickers";
export type {
  DateSheetProps,
  KeyboardAccessoryOptions,
  KeyboardDoneBarProps,
  KeyboardDoneBarToolbarProps,
  QuickDateChip,
  RepeatChoice,
  RepeatOptionsProps,
  RepeatRule,
  SliderProps,
} from "./pickers";
export { PressableScale } from "./pressable-scale";
export type { PressableScaleProps } from "./pressable-scale";
export { Text } from "./text";
export type { TextProps, TextTone } from "./text";
