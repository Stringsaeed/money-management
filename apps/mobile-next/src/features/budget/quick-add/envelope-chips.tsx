import { StyleSheet, View } from "react-native";

import { Chip, space, TextField } from "@/ui/trove";

import type { EnvelopeLine } from "../home/home-model";

import { ChipRow } from "./chip-row";
import { ENVELOPE_SEARCH_THRESHOLD } from "./quick-add-model";

interface EnvelopeChipsProps {
  readonly envelopes: readonly EnvelopeLine[];
  /** Every active envelope, so the search field appears whatever the current filter shows. */
  readonly totalCount: number;
  readonly selectedId: string | null;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly onSelect: (id: string) => void;
}

/** Recently used envelopes first, then the rest; searchable once there are many. */
export function EnvelopeChips({
  envelopes,
  totalCount,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: EnvelopeChipsProps) {
  return (
    <View style={styles.container}>
      {totalCount > ENVELOPE_SEARCH_THRESHOLD ? (
        <TextField
          label="Find an envelope"
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      ) : null}
      <ChipRow label="Envelope">
        {envelopes.map(({ envelope }) => (
          <Chip
            key={envelope.id}
            label={envelope.name}
            selected={envelope.id === selectedId}
            onPress={() => onSelect(envelope.id)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: space[2] } });
