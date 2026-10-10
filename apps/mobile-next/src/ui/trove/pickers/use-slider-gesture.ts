import { useState } from "react";
import { usePanGesture } from "react-native-gesture-handler";
import type { LayoutChangeEvent } from "react-native";

import { sliderDetentHaptic } from "./slider-haptic";
import { THUMB_SIZE } from "./slider-metrics";
import { crossesDetent, sliderFraction, sliderValueFromOffset } from "./slider-utils";

interface SliderGestureOptions {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  disabled: boolean;
  onValueChange: (value: number) => void;
}

/**
 * Touch handling for the slider: the value follows the finger from the first touch (so a tap
 * jumps there), snapped to `step`, with a light haptic at 0, 50 and 100%. The thumb centre
 * travels the touch area minus one thumb width, so the thumb never leaves its bounds.
 */
export function useSliderGesture({
  value,
  minimumValue,
  maximumValue,
  step,
  disabled,
  onValueChange,
}: SliderGestureOptions) {
  const [width, setWidth] = useState(0);

  const moveTo = (x: number) => {
    const next = sliderValueFromOffset(
      x - THUMB_SIZE / 2,
      width - THUMB_SIZE,
      minimumValue,
      maximumValue,
      step,
    );
    if (next === value) return;
    const from = sliderFraction(value, minimumValue, maximumValue);
    const to = sliderFraction(next, minimumValue, maximumValue);
    if (crossesDetent(from, to)) sliderDetentHaptic();
    onValueChange(next);
  };

  const gesture = usePanGesture({
    runOnJS: true,
    enabled: !disabled,
    minDistance: 0,
    onActivate: (event) => moveTo(event.x),
    onUpdate: (event) => moveTo(event.x),
  });

  return {
    gesture,
    onLayout: (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width),
  };
}
