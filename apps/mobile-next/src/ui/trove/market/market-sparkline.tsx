import Svg, { Path } from "react-native-svg";

import { colors } from "../tokens";
import { SPARKLINE_HEIGHT, SPARKLINE_WIDTH, sparklinePath } from "./utils";

export interface MarketSparklineProps {
  /** Oldest first. */
  values: readonly number[];
  /** Positive draws in positive.text, negative in negative.text. */
  up: boolean;
}

const STROKE_WIDTH = 1.75;

/** Decorative 56x24 trend line; the row's spoken label carries the change. */
export function MarketSparkline({ values, up }: MarketSparklineProps) {
  const path = sparklinePath(values);
  return (
    <Svg
      accessibilityElementsHidden
      height={SPARKLINE_HEIGHT}
      importantForAccessibility="no-hide-descendants"
      width={SPARKLINE_WIDTH}
    >
      {path ? (
        <Path
          d={path}
          fill="none"
          stroke={up ? colors.positive.text : colors.negative.text}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={STROKE_WIDTH}
        />
      ) : null}
    </Svg>
  );
}
