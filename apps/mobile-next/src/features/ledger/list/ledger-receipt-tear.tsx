import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/ui/trove";

/** The empty receipt's width on the 390pt board, and its 10pt teeth. */
const BOARD_WIDTH = 314;
const DEPTH = 10;
const TOOTH = 10;

function tearPath(): string {
  let path = `M0 0H${BOARD_WIDTH}V0`;
  for (let x = BOARD_WIDTH; x - TOOTH >= 0; x -= TOOTH) {
    path += `L${x - TOOTH / 2} ${DEPTH}L${x - TOOTH} 0`;
  }
  return `${path}L0 0Z`;
}

const PATH = tearPath();

/** The paper slip's torn bottom edge, drawn on the board's width and stretched to the slip. */
export function LedgerReceiptTear() {
  return (
    <Svg
      accessibilityElementsHidden
      height={DEPTH}
      importantForAccessibility="no-hide-descendants"
      preserveAspectRatio="none"
      style={styles.tear}
      viewBox={`0 0 ${BOARD_WIDTH} ${DEPTH}`}
      width="100%"
    >
      <Path d={PATH} fill={colors.surface.paper} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Overlaps the slip by a hairline so no seam shows at fractional widths.
  tear: { marginTop: -0.5 },
});
