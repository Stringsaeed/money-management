import { StyleSheet, View } from "react-native";

import { space } from "@/ui/trove";

import { SectionStamp } from "./section-stamp";
import { inPairs, type ShareTileModel } from "./setup-household";
import { ShareTile } from "./share-tile";

interface HouseholdSharesSectionProps {
  readonly currency: string;
  readonly tiles: readonly ShareTileModel[];
  readonly shares: Readonly<Record<string, string>>;
  readonly onChange: (userId: string, text: string) => void;
}

/**
 * H2 Monthly shares: what each member expects to put in each month. Informational: kept with
 * the draft on this device, it never changes the plan or the numbers.
 */
export function HouseholdSharesSection({
  currency,
  tiles,
  shares,
  onChange,
}: HouseholdSharesSectionProps) {
  if (tiles.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionStamp label="MONTHLY SHARES" trailing="For reference only" trailingStyle="note" />
      {inPairs(tiles).map((pair) => (
        <View key={pair.map((tile) => tile.userId).join(":")} style={styles.row}>
          {pair.map((tile) => (
            <ShareTile
              key={tile.userId}
              currency={currency}
              onChange={onChange}
              tile={tile}
              value={shares[tile.userId] ?? ""}
            />
          ))}
          {pair.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  row: { flexDirection: "row", gap: 10 },
  spacer: { flex: 1 },
});
