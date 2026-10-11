import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/ui/trove";

interface HomeReceiptTearProps {
  /** Tooth depth: 8 under the safe-to-spend slip, 10 under the first receipt. */
  readonly depth: number;
}

const BOARD_WIDTH = 350;
const TOOTH = 10;

/** Zigzag torn edge, drawn on the board's 350pt width and stretched to the slip. */
function tearPath(depth: number): string {
  let path = `M0 0H${BOARD_WIDTH}V0`;
  for (let x = BOARD_WIDTH; x > 0; x -= TOOTH) {
    path += `L${x - TOOTH / 2} ${depth}L${x - TOOTH} 0`;
  }
  return `${path}Z`;
}

const PATHS = { 8: tearPath(8), 10: tearPath(10) } as const;

/** The paper slip's torn bottom edge. Decorative. */
export function HomeReceiptTear({ depth }: HomeReceiptTearProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={depth}
      importantForAccessibility="no-hide-descendants"
      preserveAspectRatio="none"
      style={styles.tear}
      viewBox={`0 0 ${BOARD_WIDTH} ${depth}`}
      width="100%"
    >
      <Path d={depth === 10 ? PATHS[10] : PATHS[8]} fill={colors.surface.paper} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Overlaps the slip by a hairline so no seam shows at fractional widths.
  tear: { marginTop: -0.5 },
});
