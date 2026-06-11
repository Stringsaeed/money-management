import { Platform, StyleSheet } from "react-native";

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
});
