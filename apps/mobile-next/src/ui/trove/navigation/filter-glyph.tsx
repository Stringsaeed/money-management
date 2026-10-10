import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

import { UI_ICONS } from "../icon";

export interface FilterGlyphProps {
  color: ColorValue;
  /** Solid funnel (fill + stroke) while a filter is on. */
  filled: boolean;
}

/** The funnel from the icon set, which has no filled twin of its own. */
export function FilterGlyph({ color, filled }: FilterGlyphProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={20}
      importantForAccessibility="no-hide-descendants"
      viewBox="0 0 24 24"
      width={20}
    >
      <Path
        d={UI_ICONS.filter}
        fill={filled ? color : "none"}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}
