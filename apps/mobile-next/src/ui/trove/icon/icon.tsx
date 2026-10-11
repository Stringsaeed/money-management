import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "../tokens";
import { hasFilledTwin, iconPath, type IconName } from "./icon-paths";

export interface IconProps {
  name: IconName;
  /** 16, 20, 24 (default) or 32. */
  size?: number;
  /** Defaults to text.primary. Use text.secondary or accent.text, never category hues on UI icons. */
  color?: ColorValue;
  /** Navigation icons only: the solid twin for the selected tab. */
  filled?: boolean;
  /** Overrides the size-based stroke (1.5 at 16 and 32, 1.75 otherwise). */
  strokeWidth?: number;
  /** Icons are decorative unless labelled; label the button that holds them instead. */
  accessibilityLabel?: string;
}

const strokeForSize = (size: number) => (size <= 16 || size >= 32 ? 1.5 : 1.75);

export function Icon({
  name,
  size = 24,
  color = colors.text.primary,
  filled = false,
  strokeWidth,
  accessibilityLabel,
}: IconProps) {
  const solid = filled && hasFilledTwin(name);
  return (
    <Svg
      accessibilityElementsHidden={!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      height={size}
      importantForAccessibility={accessibilityLabel ? "yes" : "no-hide-descendants"}
      viewBox="0 0 24 24"
      width={size}
    >
      {solid ? (
        <Path d={iconPath(name, true)} fill={color} fillRule="evenodd" />
      ) : (
        <Path
          d={iconPath(name, false)}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? strokeForSize(size)}
        />
      )}
    </Svg>
  );
}
