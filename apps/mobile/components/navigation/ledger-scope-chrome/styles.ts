import { StyleSheet } from "react-native";

import { colors, rawColorValues, spacing, typography, radii } from "@/lib/design-tokens";

export const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radii.lg,
    gap: spacing[1],
    minWidth: 60,
  },
  triggerInteractive: {
    backgroundColor: `${rawColorValues.light.foreground}08`,
  },
  emoji: {
    fontSize: typography.textBase,
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.foreground,
    maxWidth: 100,
  },
  caret: {
    opacity: 0.5,
  },
  sheetContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  sheetHeader: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    color: colors.foreground,
    marginBottom: spacing[4],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  optionRowActive: {
    backgroundColor: `${rawColorValues.light.sage}20`,
  },
  optionEmoji: {
    fontSize: typography.textLg,
  },
  optionText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.foreground,
  },
  checkmark: {
    opacity: 0,
  },
  checkmarkActive: {
    opacity: 1,
  },
});

export const darkStyles = StyleSheet.create({
  triggerInteractive: {
    backgroundColor: `${rawColorValues.dark.foreground}08`,
  },
  optionRowActive: {
    backgroundColor: `${rawColorValues.dark.sage}20`,
  },
});
