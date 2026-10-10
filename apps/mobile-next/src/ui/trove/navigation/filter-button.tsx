import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, layout, radius, space } from "../tokens";
import { FilterGlyph } from "./filter-glyph";
import { filterAccessibilityLabel, showsFilterCount } from "./utils";

export interface FilterButtonProps {
  onPress: () => void;
  /** Any filter is applied: the disc turns accent and the funnel solid. */
  active?: boolean;
  /** Number of applied filters; the badge shows from 2 up and is hidden at 0 and 1. */
  count?: number;
  /** Spoken base name; "active" and the count are appended. */
  label?: string;
  testID?: string;
}

/** 44pt ledger filter control: neutral off, accent when active, with a count badge for 2+. */
export function FilterButton({
  onPress,
  active = false,
  count = 0,
  label = "Filter",
  testID,
}: FilterButtonProps) {
  const state = { active, count };
  const badged = showsFilterCount(state);

  return (
    <PressableScale
      accessibilityLabel={filterAccessibilityLabel(label, state)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      pressedStyle={active ? styles.activePressed : styles.idlePressed}
      style={[styles.body, active ? styles.active : styles.idle, badged ? styles.badged : null]}
      testID={testID}
    >
      <FilterGlyph color={active ? colors.accent.on : colors.text.primary} filled={active} />
      {badged ? (
        <View style={styles.badge}>
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={styles.badgeLabel}
            variant="amountSm"
          >
            {count}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: space[1] + space[0.5],
    height: layout.minTouchTarget,
    justifyContent: "center",
    minWidth: layout.minTouchTarget,
  },
  idle: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  active: { backgroundColor: colors.accent.fill },
  badged: { paddingLeft: space[3], paddingRight: space[2] },
  idlePressed: { backgroundColor: colors.border.default },
  activePressed: { backgroundColor: colors.accent.pressed },
  badge: {
    alignItems: "center",
    backgroundColor: colors.accent.on,
    borderRadius: radius.full,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: space[1] + space[0.5],
  },
  badgeLabel: { color: colors.accent.fill, fontFamily: fonts.monoSemibold, fontSize: 12 },
});
