import type { ComponentProps } from "react";
import { createNanoIconSet } from "react-native-nano-icons";
import { useColorScheme } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Nano icons take their color as a native prop, which only Reanimated animated props can tween.
import {
  createAnimatedComponent,
  interpolateColor,
  processColor,
  useAnimatedProps,
} from "react-native-reanimated";

import glyphMap from "../../assets/nanoicons/TroveCurrencies.glyphmap.json";
import { rawColorValues } from "./design-tokens";
import { useTintProgress } from "./use-tint-progress";

const NanoCurrencyIcon = createNanoIconSet(glyphMap);

type NanoCurrencyIconProps = ComponentProps<typeof NanoCurrencyIcon>;

interface NativeCurrencyIconProps extends NanoCurrencyIconProps {
  /** Native glyph layer colors; only ever set from the UI thread by animated props. */
  readonly colors?: readonly number[];
}

/** Declares the native `colors` prop for Reanimated and keeps it out of the JS render. */
function NativeCurrencyIcon({ colors: _uiThreadColors, ...props }: NativeCurrencyIconProps) {
  return <NanoCurrencyIcon {...props} />;
}

const AnimatedCurrencyIcon = createAnimatedComponent(NativeCurrencyIcon);

export type CurrencyGlyphName = keyof typeof glyphMap.i;

interface CurrencyGlyphProps {
  readonly name: CurrencyGlyphName;
  readonly size: number;
  /** Tints from muted to ink, matching the amount digits once a value is entered. */
  readonly active: boolean;
}

/** Currency symbols with no reliable font glyph (Saudi riyal, UAE dirham), rendered from `assets/currencies`. */
export function CurrencyGlyph({ name, size, active }: CurrencyGlyphProps) {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? rawColorValues.dark : rawColorValues.light;
  const muted = palette.mutedForeground;
  const ink = palette.ink;
  const progress = useTintProgress(active);
  // The tween writes the native view's `colors` layers straight from the UI thread. `color` keeps
  // the resting value so re-renders (e.g. the amount resizing) commit the same end state.
  const animatedProps = useAnimatedProps(
    // `| 0` wraps the unsigned ARGB into the Int32 the native `colors` prop is typed as.
    () => ({ colors: [processColor(interpolateColor(progress.value, [0, 1], [muted, ink])) | 0] }),
    [muted, ink],
  );

  return (
    <AnimatedCurrencyIcon
      accessibilityElementsHidden
      accessible={false}
      animatedProps={animatedProps}
      color={active ? ink : muted}
      importantForAccessibility="no"
      name={name}
      size={size}
    />
  );
}
