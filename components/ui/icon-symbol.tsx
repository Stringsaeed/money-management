// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SymbolViewProps, SymbolWeight } from "expo-symbols";
import type { ComponentProps } from "react";
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation / system
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  xmark: "close",
  "xmark.circle.fill": "cancel",
  checkmark: "check",
  "checkmark.circle.fill": "check-circle",
  ellipsis: "more-horiz",
  "ellipsis.circle.fill": "more-horiz",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up.arrow.down": "swap-vert",

  // Tabs
  "chart.pie.fill": "pie-chart",
  "list.bullet": "format-list-bulleted",
  "creditcard.fill": "credit-card",
  "gearshape.fill": "settings",

  // Finance / accounts
  "banknote.fill": "attach-money",
  "wallet.bifold.fill": "account-balance-wallet",
  "dollarsign.circle.fill": "monetization-on",
  "chart.line.uptrend.xyaxis": "trending-up",
  "chart.line.downtrend.xyaxis": "trending-down",
  "arrow.left.arrow.right": "swap-horiz",

  // Transactions
  plus: "add",
  "plus.circle.fill": "add-circle",
  minus: "remove",
  "minus.circle.fill": "remove-circle",
  pencil: "edit",
  "trash.fill": "delete",
  "arrow.uturn.backward": "undo",

  // Categories / icons
  "tag.fill": "label",
  "fork.knife": "restaurant",
  "car.fill": "directions-car",
  "house.fill.badge.checkmark": "home",
  "bolt.fill": "bolt",
  "cross.fill": "local-hospital",
  "tv.fill": "tv",
  "bag.fill": "shopping-bag",
  "book.fill": "menu-book",
  "heart.fill": "favorite",
  "briefcase.fill": "work",
  "gift.fill": "card-giftcard",
  calendar: "calendar-today",
  "calendar.badge.clock": "event",

  // Misc
  "info.circle": "info",
  "questionmark.circle": "help",
  "bell.fill": "notifications",
  magnifyingglass: "search",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
