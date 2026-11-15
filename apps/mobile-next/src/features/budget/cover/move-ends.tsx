import { StyleSheet, View } from "react-native";

import { signedCompact } from "../envelope/envelope-figures";

import type { Place } from "./cover-move-model";
import { MoveEndRow } from "./move-end-row";
import { MovePlacePicker } from "./move-place-picker";
import { SwapButton } from "./swap-button";
import type { MoveEnd } from "./use-move-form";

interface MoveEndsProps {
  readonly places: readonly Place[];
  readonly from: Place | undefined;
  readonly to: Place | undefined;
  readonly picking: MoveEnd | null;
  readonly emojis: ReadonlyMap<string, string>;
  readonly currency: string;
  readonly onToggle: (end: MoveEnd) => void;
  readonly onChoose: (end: MoveEnd, key: string) => void;
  readonly onSwap: () => void;
}

/** FROM over TO with the swap disc on their seam, and the chips of whichever end is open. */
export function MoveEnds({
  places,
  from,
  to,
  picking,
  emojis,
  currency,
  onToggle,
  onChoose,
  onSwap,
}: MoveEndsProps) {
  const row = (end: MoveEnd, place: Place | undefined) => (
    <MoveEndRow
      emoji={place ? emojis.get(place.key) : undefined}
      end={end === "from" ? "FROM" : "TO"}
      expanded={picking === end}
      left={place ? signedCompact(place.availableMinor, currency) : undefined}
      name={place?.name}
      negative={(place?.availableMinor ?? 0) < 0}
      onPress={() => onToggle(end)}
    />
  );
  const other = picking === "from" ? to : from;
  return (
    <View style={styles.column}>
      <View style={styles.pair}>
        {row("from", from)}
        {row("to", to)}
        {to ? (
          <View pointerEvents="box-none" style={styles.swap}>
            <SwapButton onPress={onSwap} />
          </View>
        ) : null}
      </View>
      {picking ? (
        <MovePlacePicker
          key={picking}
          currency={currency}
          emojis={emojis}
          end={picking === "from" ? "From" : "To"}
          places={places.filter((place) => place.key !== other?.key)}
          selectedKey={(picking === "from" ? from : to)?.key ?? null}
          onSelect={(key) => onChoose(picking, key)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 12 },
  pair: { gap: 8 },
  // Centred on the 8pt seam between the two 64pt cards.
  swap: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
