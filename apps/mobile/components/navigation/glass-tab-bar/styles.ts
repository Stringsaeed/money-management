import { Platform, StyleSheet } from "react-native";

import { colors, rawColorValues, spacing, radii } from "@/lib/design-tokens";

import { CREATE_SIZE, PILL_PADDING, TAB_HEIGHT, TAB_WIDTH } from "./constants";

export const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 16,
  },
  pill: {
    borderRadius: 999,
    // overflow: "hidden",
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
    flexDirection: "row",
    alignItems: "center",
    padding: PILL_PADDING,
  },
  tab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  capsule: {
    position: "absolute",
    left: PILL_PADDING,
    top: PILL_PADDING,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: 999,
    boxShadow: [
      { inset: true, offsetX: 0, offsetY: 2, blurRadius: 6, color: "rgba(0,0,0,0.12)" },
      { inset: true, offsetX: 0, offsetY: -1, blurRadius: 2, color: "rgba(255,255,255,0.5)" },
    ],
  },
  insetShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    boxShadow: [
      { inset: true, offsetX: 0, offsetY: 2, blurRadius: 6, color: "rgba(0,0,0,0.12)" },
      { inset: true, offsetX: 0, offsetY: -1, blurRadius: 2, color: "rgba(255,255,255,0.5)" },
    ],
  },
  create: {
    width: CREATE_SIZE,
    height: CREATE_SIZE,
    borderRadius: CREATE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  fallback: {
    overflow: "hidden",
  },

  capsuleOverlay: {
    backgroundColor: `${rawColorValues.light.foreground}1A`,
  },

  fallbackOverlay: {
    backgroundColor: `${rawColorValues.light.foreground}0D`,
    borderWidth: 1,
    borderColor: `${rawColorValues.light.foreground}1A`,
  },

  iconFocused: {
    color: colors.foreground,
  },

  iconUnfocused: {
    color: `${rawColorValues.light.foreground}8C`,
  },

  createPressable: {
    width: spacing[14],
    height: spacing[14],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },

  createPressableDisabled: {
    opacity: 0.5,
  },

  createIcon: {
    color: colors.foreground,
  },
});

export const darkStyles = StyleSheet.create({
  capsuleOverlay: {
    backgroundColor: `${rawColorValues.dark.foreground}1A`,
  },

  fallbackOverlay: {
    backgroundColor: `${rawColorValues.dark.foreground}0D`,
    borderWidth: 1,
    borderColor: `${rawColorValues.dark.foreground}1A`,
  },

  iconUnfocused: {
    color: `${rawColorValues.dark.foreground}8C`,
  },
});
