import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, Text } from "@/ui/trove";

import { highlightParts } from "../search/search-highlight";

interface LedgerRowTitleProps {
  readonly title: string;
  /** The search text: its first match in the title is marked in lime. */
  readonly highlight?: string;
}

/** A row's one-line title, with the search match marked as on the search board. */
export function LedgerRowTitle({ title, highlight = "" }: LedgerRowTitleProps) {
  const parts = highlightParts(title, highlight);
  return (
    <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
      {parts ? (
        <>
          {parts.pre}
          <NativeText style={styles.mark}>{parts.hit}</NativeText>
          {parts.post}
        </>
      ) : (
        title
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Ink on lime in both modes, like the totals marker.
  mark: { backgroundColor: colors.highlight, color: colors.paper.ink },
});
