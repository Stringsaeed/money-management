import Svg, { Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

interface TinySproutGraphicProps {
  width?: number;
}

/** A single small sprout — for compact empty spots like charts. */
export function TinySproutGraphic({ width = 40 }: TinySproutGraphicProps) {
  const { ink, sage } = useGraphicPalette();
  const height = (width * 40) / 48;

  return (
    <Svg width={width} height={height} viewBox="0 0 48 40" fill="none">
      <Path
        d="M8 34 C18 32 30 32 40 34"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path d="M24 32 C24 26 24 20 24 14" stroke={sage} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M24 22 Q16 21 13 12 Q21 13 24 22 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M24 17 Q32 16 35 7 Q27 8 24 17 Z"
        fill={sage}
        fillOpacity={0.35}
        stroke={sage}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
