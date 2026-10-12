import { StyleSheet } from "react-native";

import { layout } from "@/ui/trove";

/** Board: content starts 56pt from the top of a 390x844 iPhone, under a 47pt status bar. */
const BOARD_TOP_BELOW_INSET = 56 - 47;

export const dueLayout = StyleSheet.create({
  /** Applied inside a top-and-bottom safe-area Screen. */
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: 18, paddingBottom: 40, paddingTop: BOARD_TOP_BELOW_INSET },
});
