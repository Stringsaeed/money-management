import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  motion,
  space,
  Text,
  troveTransition,
} from "@/ui/trove";

import type { HomeUpcomingItem } from "./home-upcoming-model";
import { HomeUpcomingRow } from "./home-upcoming-row";

interface HomeUpcomingProps {
  readonly items: readonly HomeUpcomingItem[];
  readonly currency: string;
  /** Rows still loading: print nothing rather than a premature "nothing scheduled". */
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onOpen: (ruleId: string) => void;
  readonly onSeeAll: () => void;
}

/** The next few bills and paydays, nearest first. */
export function HomeUpcoming({
  items,
  currency,
  loading,
  failed,
  onOpen,
  onSeeAll,
}: HomeUpcomingProps) {
  const reducedMotion = useReducedMotion();
  return (
    <View>
      <View style={styles.heading}>
        <NativeText
          accessibilityRole="header"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.stamp}
        >
          UPCOMING
        </NativeText>
        <Pressable
          accessibilityLabel="See all upcoming"
          accessibilityRole="link"
          hitSlop={12}
          onPress={onSeeAll}
        >
          <Text tone="accent" variant="labelMd">
            See all
          </Text>
        </Pressable>
      </View>
      {loading && !failed ? null : failed || items.length === 0 ? (
        <Text style={styles.note} tone="tertiary" variant="bodySm">
          {failed
            ? "Upcoming bills are unavailable. Pull down to try again."
            : "Nothing scheduled. A little breathing room."}
        </Text>
      ) : (
        items.map((item) => (
          <EaseView
            animate={{ opacity: 1 }}
            initialAnimate={{ opacity: 0 }}
            key={item.key}
            transition={troveTransition(reducedMotion, motion.base)}
          >
            <HomeUpcomingRow currency={currency} item={item} onPress={onOpen} />
          </EaseView>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: space[0.5],
  },
  stamp: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  note: { paddingVertical: space[4] },
});
