import { jest } from "@jest/globals";

interface SharedValue<T> {
  value: T;
  get: () => T;
  set: (value: T) => void;
}

export const Easing = {
  cubic: (value: number) => value,
  linear: (value: number) => value,
  out: (easing: (value: number) => number) => easing,
};

export const useAnimatedStyle = jest.fn(<T>(updater: () => T): T => updater());

export const useSharedValue = jest.fn(<T>(initial: T): SharedValue<T> => {
  const shared: SharedValue<T> = {
    value: initial,
    get: () => shared.value,
    set: (next) => {
      shared.value = next;
    },
  };
  return shared;
});

export const withTiming = jest.fn(<T>(value: T): T => value);

export const withSpring = jest.fn(<T>(value: T): T => value);

export const useAnimatedProps = jest.fn(<T>(updater: () => T): T => updater());

/** Snaps to the nearest end color instead of blending. */
export const interpolateColor = (
  value: number,
  _input: readonly number[],
  output: readonly string[],
): string => output[value >= 0.5 ? output.length - 1 : 0] ?? "";

/** Hex-only stand-in for the native ARGB conversion. */
export const processColor = (color: string): number =>
  Number.parseInt(`ff${color.replace("#", "")}`, 16);

export const createAnimatedComponent = <T>(component: T): T => component;

const Animated = { View: "View", Text: "Text", createAnimatedComponent };

export default Animated;
