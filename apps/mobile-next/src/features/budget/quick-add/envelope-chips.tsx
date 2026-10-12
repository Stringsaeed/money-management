import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { layout, SelectChip, space, Text, TextField } from "@/ui/trove";

import type { EnvelopeChip } from "./envelope-chip-model";
import { ENVELOPE_SEARCH_THRESHOLD } from "./quick-add-model";

interface EnvelopeChipsProps {
  readonly chips: readonly EnvelopeChip[];
  /** Every active envelope, so the search stays on offer whatever the current filter shows. */
  readonly totalCount: number;
  readonly selectedId: string | null;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly onSelect: (id: string) => void;
}

/** "ENVELOPE · RECENT FIRST": a sideways row of envelope chips; "All" searches once there are many. */
export function EnvelopeChips({
  chips,
  totalCount,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: EnvelopeChipsProps) {
  const [searching, setSearching] = useState(query !== "");
  const searchable = totalCount > ENVELOPE_SEARCH_THRESHOLD;
  return (
    <View style={styles.container}>
      <Text style={styles.label} tone="tertiary" variant="stamp">
        Envelope · recent first
      </Text>
      {searchable && searching ? (
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          label="Find an envelope"
          onChangeText={onQueryChange}
          returnKeyType="search"
          value={query}
        />
      ) : null}
      <ScrollView
        accessibilityLabel="Envelope"
        accessibilityRole="radiogroup"
        contentContainerStyle={styles.chips}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
      >
        {chips.map((chip) => (
          <SelectChip
            emoji={chip.emoji}
            key={chip.id}
            label={chip.label}
            meta={chip.meta}
            onPress={() => onSelect(chip.id)}
            selected={chip.id === selectedId}
            variant="envelope"
          />
        ))}
        {searchable ? (
          <SelectChip
            accessibilityLabel={searching ? "Hide envelope search" : "Search all envelopes"}
            accessibilityRole="button"
            emoji="🔎"
            label="All"
            onPress={() => {
              if (searching) onQueryChange("");
              setSearching((current) => !current);
            }}
            selected={searching}
            variant="envelope"
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[2] },
  // Board: the section label is 10pt, a step under the 11pt stamp.
  label: { fontSize: 10, lineHeight: 13 },
  // The row runs to the sheet's right edge, past the gutter.
  scroller: { marginRight: -layout.screenGutter },
  chips: { gap: space[2], paddingRight: layout.screenGutter },
});
