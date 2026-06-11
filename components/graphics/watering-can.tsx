import Svg, { Circle, Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface WateringCanGraphicProps {
  width?: number;
}

/** Watering can tending a seedling — for empty recurring payments. */
export function WateringCanGraphic({ width = 120 }: WateringCanGraphicProps) {
  const { ink, sage, terracotta, surfaceDim } = useGraphicPalette();
  const height = (width * 96) / 120;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 96" fill="none">
      {/* Body */}
      <Path
        d="M52 40 H86 Q92 40 92 46 V64 Q92 70 86 70 H58 Q52 70 52 64 Z"
        fill={surfaceDim}
        fillOpacity={0.5}
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Spout */}
      <Path
        d="M52 58 L30 38 L36 32 L54 46"
        fill={surfaceDim}
        fillOpacity={0.5}
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Handle */}
      <Path d="M92 48 C104 48 104 62 92 62" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* Lid knob */}
      <Path d="M62 40 C62 35 76 35 76 40" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* Water drops */}
      <Circle cx={26} cy={48} r={2} fill={sage} />
      <Circle cx={20} cy={58} r={2} fill={sage} />
      <Circle cx={27} cy={64} r={2} fill={sage} />
      {/* Seedling */}
      <Path d="M20 82 C20 78 20 76 20 72" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M20 76 Q13 75 10 68 Q17 69 20 76 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={20} cy={70} r={2.5} fill={terracotta} />
      {/* Ground */}
      <Path
        d="M8 84 C20 82 32 82 44 84"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}
