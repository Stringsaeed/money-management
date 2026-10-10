import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

interface SliderSpeakerIconProps {
  color: ColorValue;
}

/** The speaker without waves, the quiet end of a volume slider. Trove has no such icon yet. */
export function SliderSpeakerIcon({ color }: SliderSpeakerIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={20}
      importantForAccessibility="no-hide-descendants"
      viewBox="0 0 24 24"
      width={20}
    >
      <Path
        d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}
