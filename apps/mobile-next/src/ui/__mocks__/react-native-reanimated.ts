import { jest } from "@jest/globals";

interface SharedValue<T> {
  value: T;
}

export const Easing = {
  cubic: (value: number) => value,
  out: (easing: (value: number) => number) => easing,
};

export const useAnimatedStyle = jest.fn(<T>(updater: () => T): T => updater());

export const useSharedValue = jest.fn(<T>(value: T): SharedValue<T> => ({ value }));

export const withTiming = jest.fn(<T>(value: T): T => value);

const Animated = { View: "View" };

export default Animated;
