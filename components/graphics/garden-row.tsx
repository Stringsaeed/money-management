import Svg, { Circle, Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface GardenRowGraphicProps {
  width?: number;
}

/** A row of sprouts at different growth stages — for onboarding and fresh starts. */
export function GardenRowGraphic({ width = 160 }: GardenRowGraphicProps) {
  const { ink, sage, terracotta } = useGraphicPalette();
  const height = (width * 56) / 160;

  return (
    <Svg width={width} height={height} viewBox="0 0 160 56" fill="none">
      {/* Ground */}
      <Path d="M8 48 C56 44 104 44 152 48" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={26} cy={51} r={1.5} fill={ink} opacity={0.4} />
      <Circle cx={102} cy={51} r={1.5} fill={ink} opacity={0.4} />
      <Circle cx={140} cy={50} r={1.5} fill={ink} opacity={0.4} />
      {/* Seedling */}
      <Path d="M40 46 C40 42 40 40 40 37" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M40 40 Q34 39 31 33 Q38 34 40 40 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Sprout */}
      <Path d="M80 45 C80 38 80 32 80 26" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M80 35 Q72 34 69 26 Q77 27 80 35 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M80 30 Q88 29 91 21 Q83 22 80 30 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Budding plant */}
      <Path
        d="M120 45 C120 36 120 28 120 20"
        stroke={sage}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M120 34 Q112 33 109 25 Q117 26 120 34 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M120 28 Q128 27 131 19 Q123 20 120 28 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle
        cx={120}
        cy={14}
        r={4}
        fill={terracotta}
        fillOpacity={0.35}
        stroke={terracotta}
        strokeWidth={2}
      />
    </Svg>
  );
}
