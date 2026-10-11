import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts, PressableScale, radius, space } from "@/ui/trove";

import { HomeDashedRule } from "./home-dashed-rule";
import { HomeLeaderRow } from "./home-leader-row";
import { HomeReceiptTear } from "./home-receipt-tear";

interface HomeEmptyReceiptProps {
  readonly onAddAccount: () => void;
  readonly onSetUpCategories: () => void;
}

/** Receipt #0001: nothing printed yet, and the first account to start from. */
export function HomeEmptyReceipt({ onAddAccount, onSetUpCategories }: HomeEmptyReceiptProps) {
  return (
    <View>
      <View style={styles.slip}>
        <NativeText style={styles.header}>TROVE · RECEIPT #0001</NativeText>
        <HomeDashedRule color={colors.paper.ruleStrong} pattern={[4, 3]} thickness={1.5} />
        <NativeText
          accessibilityElementsHidden
          allowFontScaling={false}
          importantForAccessibility="no"
          style={styles.emoji}
        >
          👋
        </NativeText>
        <NativeText accessibilityRole="header" style={styles.title}>
          Nothing printed yet
        </NativeText>
        <NativeText style={styles.body}>
          Add the account you spend from most. Your first receipt starts there.
        </NativeText>
        <View style={styles.leaders}>
          <HomeLeaderRow label="ACCOUNTS" value="0" />
          <HomeLeaderRow label="ENTRIES" value="0" />
        </View>
        <HomeDashedRule color={colors.paper.ruleStrong} pattern={[4, 3]} thickness={1.5} />
        <View style={styles.primaryWrap}>
          <PressableScale accessibilityRole="button" onPress={onAddAccount} style={styles.primary}>
            <NativeText style={styles.primaryLabel}>Add your first account</NativeText>
          </PressableScale>
        </View>
        <Pressable accessibilityRole="link" onPress={onSetUpCategories} style={styles.secondary}>
          <NativeText style={styles.secondaryLabel}>Set up categories</NativeText>
        </Pressable>
      </View>
      <HomeReceiptTear depth={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  slip: {
    alignItems: "center",
    backgroundColor: colors.surface.paper,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.paper.shadow }],
    gap: 14,
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  header: {
    color: colors.text.onPaper,
    fontFamily: fonts.monoSemibold,
    fontSize: 13,
    letterSpacing: 2,
    lineHeight: 17,
  },
  emoji: { fontSize: 52, lineHeight: 60 },
  title: {
    color: colors.text.onPaper,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
    textAlign: "center",
  },
  body: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 260,
    textAlign: "center",
  },
  leaders: { alignSelf: "stretch", gap: 6 },
  // PressableScale animates an inner view, so the stretch lives on a wrapper.
  primaryWrap: { alignSelf: "stretch" },
  primary: {
    alignItems: "center",
    backgroundColor: colors.paper.ink,
    borderRadius: radius.full,
    height: 52,
    justifyContent: "center",
  },
  primaryLabel: {
    color: colors.highlight,
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
  },
  secondary: { height: 40, justifyContent: "center", paddingHorizontal: space[4] },
  secondaryLabel: {
    color: colors.paper.accentText,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
});
