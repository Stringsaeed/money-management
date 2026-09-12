import { describe, expect, it } from "@jest/globals";

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (c: unknown) => c,
      View: "Animated.View",
    },
    cancelAnimation: jest.fn(),
    createAnimatedComponent: (c: unknown) => c,
    Easing: { linear: jest.fn() },
    useAnimatedProps: () => ({}),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    useReducedMotion: () => false,
    useSharedValue: (v: unknown) => ({ value: v }),
    withRepeat: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});

jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: "Svg",
  Circle: "Circle",
  Ellipse: "Ellipse",
  Path: "Path",
}));

jest.mock("./palette", () => ({
  useGraphicPalette: () => ({
    soil: "#000",
    stem: "#000",
    leaf: "#000",
    bloom: "#000",
    coin: "#000",
  }),
}));

import { GARDEN_STAGES } from "./growing-garden";

describe("GARDEN_STAGES", () => {
  it("locks garden growth stage count to 6", () => {
    expect(GARDEN_STAGES).toBe(6);
  });
});
