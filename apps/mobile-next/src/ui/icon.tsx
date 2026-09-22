import {
  ArrowClockwiseIcon,
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  ChartBarIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  CheckIcon,
  DotsThreeIcon,
  EnvelopeIcon,
  FunnelIcon,
  GearSixIcon,
  HouseIcon,
  InfoIcon,
  ListIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  ReceiptIcon,
  SpinnerGapIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UserIcon,
  WalletIcon,
  XIcon,
  type Icon as PhosphorIcon,
  type IconProps as PhosphorIconProps,
} from "phosphor-react-native";
import { StyleSheet, type ColorValue, type StyleProp, type TextStyle } from "react-native";

import { colors } from "./design-tokens";

export type IconName =
  | "arrow-clockwise"
  | "arrow-down-left"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up-right"
  | "book-open"
  | "chart-bar"
  | "caret-right"
  | "chart-line-up"
  | "check"
  | "dots-three"
  | "envelope"
  | "funnel"
  | "gear"
  | "house"
  | "info"
  | "list"
  | "magnifying-glass"
  | "pencil"
  | "plus"
  | "receipt"
  | "spinner-gap"
  | "trash"
  | "trend-down"
  | "trend-up"
  | "user"
  | "wallet"
  | "x";

const ICONS = {
  "arrow-clockwise": ArrowClockwiseIcon,
  "arrow-down-left": ArrowDownLeftIcon,
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up-right": ArrowUpRightIcon,
  "book-open": BookOpenIcon,
  "chart-bar": ChartBarIcon,
  "caret-right": CaretRightIcon,
  "chart-line-up": ChartLineUpIcon,
  check: CheckIcon,
  "dots-three": DotsThreeIcon,
  envelope: EnvelopeIcon,
  funnel: FunnelIcon,
  gear: GearSixIcon,
  house: HouseIcon,
  info: InfoIcon,
  list: ListIcon,
  "magnifying-glass": MagnifyingGlassIcon,
  pencil: PencilSimpleIcon,
  plus: PlusIcon,
  receipt: ReceiptIcon,
  "spinner-gap": SpinnerGapIcon,
  trash: TrashIcon,
  "trend-down": TrendDownIcon,
  "trend-up": TrendUpIcon,
  user: UserIcon,
  wallet: WalletIcon,
  x: XIcon,
} satisfies Record<IconName, PhosphorIcon>;

export interface IconProps extends Omit<PhosphorIconProps, "color"> {
  name: IconName;
  style?: StyleProp<TextStyle>;
  color?: ColorValue;
}

export function Icon({ name, color, size = 20, style, ...props }: IconProps) {
  const IconComponent = ICONS[name];
  const flattenedStyle = StyleSheet.flatten(style);
  const resolvedColor = color ?? flattenedStyle?.color ?? colors.foreground;

  // SAFETY: Phosphor forwards this value to react-native-svg, whose fill accepts opaque native ColorValue objects.
  return <IconComponent {...props} color={resolvedColor as string} size={size} style={style} />;
}
