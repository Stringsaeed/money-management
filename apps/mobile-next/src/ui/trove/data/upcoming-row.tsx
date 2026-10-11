import { StyleSheet, View } from "react-native";

import { Amount, type SignDisplay } from "../amount";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, layout, space } from "../tokens";
import { DateChip } from "./date-chip";
import { PressableRow } from "./pressable-row";
import { upcomingRowLabel } from "./upcoming-utils";

export interface UpcomingRowProps {
  /** ISO due date, `yyyy-MM-dd`. */
  date: string;
  title: string;
  /** Caption in capitals, e.g. "IN 2 DAYS · RECURRING". See `dueInLabel`. */
  subtitle?: string;
  /** Integer minor units. Negative is a bill going out; positive is money coming in. */
  minor: number;
  currency: string;
  /** Emoji printed before the title. Decorative. */
  emoji?: string;
  /** The next item due: its date band takes the highlighter. Use `nextUpcomingIndex`. */
  next?: boolean;
  /** `always` (default) prints `+` on money in. */
  signDisplay?: SignDisplay;
  onPress?: () => void;
  testID?: string;
}

/** 68pt row: date chip, title with caption, signed amount. Dividers come from `ListGroup`. */
export function UpcomingRow({
  date,
  title,
  subtitle,
  minor,
  currency,
  emoji,
  next = false,
  signDisplay = "always",
  onPress,
  testID,
}: UpcomingRowProps) {
  return (
    <PressableRow
      accessibilityLabel={upcomingRowLabel({
        date,
        title,
        subtitle,
        minor,
        currency,
        next,
        signDisplay,
      })}
      onPress={onPress}
      style={styles.row}
      testID={testID}
    >
      <DateChip date={date} decorative highlighted={next} />
      <View style={styles.text}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {emoji ? <Text>{`${emoji} `}</Text> : null}
          {title}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            tone="tertiary"
            variant="stamp"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Amount currency={currency} minor={minor} signDisplay={signDisplay} size="md" />
    </PressableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.listRowMinHeight + 4,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space[2],
  },
  text: { flex: 1, gap: space[0.5], minWidth: 0 },
});
