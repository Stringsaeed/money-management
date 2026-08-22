import Svg, { Circle, G, Path, Rect } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface SeedPacketsGraphicProps {
  width?: number;
}

/** Two seed packets — labels for what grows where, for empty categories. */
export function SeedPacketsGraphic({ width = 96 }: SeedPacketsGraphicProps) {
  const { ink, sage, terracotta, surfaceDim } = useGraphicPalette();
  const height = (width * 96) / 120;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 96" fill="none">
      {/* Back packet */}
      <G transform="rotate(-8 46 46)">
        <Rect
          x={29}
          y={22}
          width={34}
          height={48}
          rx={4}
          fill={surfaceDim}
          fillOpacity={0.5}
          stroke={ink}
          strokeWidth={2.5}
        />
        <Path d="M29 33 H63" stroke={ink} strokeWidth={2} strokeLinecap="round" />
        <Path
          d="M46 58 Q38 56 35 48 Q43 49 46 58 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="M46 58 C46 53 46 50 46 46" stroke={sage} strokeWidth={2} strokeLinecap="round" />
      </G>
      {/* Front packet */}
      <G transform="rotate(7 74 52)">
        <Rect
          x={57}
          y={28}
          width={34}
          height={48}
          rx={4}
          fill={surfaceDim}
          stroke={ink}
          strokeWidth={2.5}
        />
        <Path d="M57 39 H91" stroke={ink} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={68} cy={54} r={2.2} fill={terracotta} />
        <Circle cx={78} cy={60} r={2.2} fill={terracotta} />
        <Circle cx={70} cy={66} r={2.2} fill={terracotta} />
      </G>
    </Svg>
  );
}
