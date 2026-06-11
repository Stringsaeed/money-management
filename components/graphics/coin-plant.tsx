import Svg, { Circle, Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface CoinPlantGraphicProps {
  width?: number;
}

/** Potted plant blooming a coin — for empty accounts. */
export function CoinPlantGraphic({ width = 96 }: CoinPlantGraphicProps) {
  const { ink, sage, terracotta, surfaceDim } = useGraphicPalette();
  const height = (width * 96) / 120;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 96" fill="none">
      {/* Pot */}
      <Path
        d="M40 62 H80 L75 88 H45 Z"
        fill={terracotta}
        fillOpacity={0.3}
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path d="M36 62 H84" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* Stem */}
      <Path d="M60 62 C60 52 60 44 60 36" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      {/* Leaves */}
      <Path
        d="M60 52 Q50 50 46 41 Q56 42 60 52 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M60 46 Q70 44 74 35 Q64 36 60 46 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Coin bloom */}
      <Circle
        cx={60}
        cy={23}
        r={11}
        fill={surfaceDim}
        fillOpacity={0.5}
        stroke={ink}
        strokeWidth={2.5}
      />
      <Circle cx={60} cy={23} r={6.5} stroke={sage} strokeWidth={1.5} />
    </Svg>
  );
}
