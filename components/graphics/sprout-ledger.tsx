import Svg, { Circle, Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface SproutLedgerGraphicProps {
  width?: number;
}

/** Open ledger book with a sprout growing from the spine — for empty journals. */
export function SproutLedgerGraphic({ width = 120 }: SproutLedgerGraphicProps) {
  const { ink, sage, terracotta, surfaceDim } = useGraphicPalette();
  const height = (width * 96) / 120;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 96" fill="none">
      {/* Pages */}
      <Path
        d="M14 38 C30 30 46 30 58 36 L58 78 C46 72 30 72 14 78 Z"
        fill={surfaceDim}
        fillOpacity={0.5}
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M106 38 C90 30 74 30 62 36 L62 78 C74 72 90 72 106 78 Z"
        fill={surfaceDim}
        fillOpacity={0.5}
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Ruled entries, left page */}
      <Path d="M22 48 C32 44 42 44 52 47" stroke={sage} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M22 57 C32 53 42 53 52 56" stroke={sage} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M22 66 C32 62 42 62 52 65" stroke={sage} strokeWidth={1.5} strokeLinecap="round" />
      {/* Ruled entries, right page */}
      <Path d="M68 47 C78 44 88 44 98 48" stroke={sage} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M68 56 C76 53 84 53 90 55" stroke={sage} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={97} cy={64} r={2.5} fill={terracotta} />
      {/* Sprout */}
      <Path d="M60 34 C60 27 60 20 60 13" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M60 22 Q50 20 46 10 Q56 11 60 22 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M60 17 Q70 15 74 5 Q64 6 60 17 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
