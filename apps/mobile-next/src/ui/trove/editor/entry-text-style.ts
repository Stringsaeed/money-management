import type { TextStyle } from "react-native";

import type { EntrySize } from "./entry-amount-utils";

/** Plex Mono at the stepped entry size; one line box per size so cells align. */
export const entryTextStyle = (size: EntrySize): TextStyle => ({
  fontSize: size,
  letterSpacing: -2,
  lineHeight: size + 4,
});
