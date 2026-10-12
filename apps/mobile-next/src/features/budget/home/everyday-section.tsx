import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { EnvelopeRow, Text } from "@/ui/trove";

import { envelopeRowModel, everydayLeftLabel } from "./envelope-row-model";
import type { EnvelopeLine } from "./home-model";
import { SectionHeader } from "./section-header";

interface EverydaySectionProps {
  readonly lines: readonly EnvelopeLine[];
  readonly currency: string;
  readonly daysLeft: number;
  /** Share of the pay period gone: the bars' pace tick. */
  readonly pace: number;
  /** Numbers could not be refreshed: names only, dashes for figures. */
  readonly stale: boolean;
  readonly emojiFor: (envelope: EnvelopeLine["envelope"]) => string;
  readonly onOpen: (envelopeId: string) => void;
  /** Quick add with this envelope chosen; absent for a role that cannot add spending. */
  readonly onQuickAdd?: (envelopeId: string) => void;
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

/** EVERYDAY: what is left across the Everyday envelopes, then one row per envelope. */
export function EverydaySection({
  lines,
  currency,
  daysLeft,
  pace,
  stale,
  emojiFor,
  onOpen,
  onQuickAdd,
  onLayout,
}: EverydaySectionProps) {
  return (
    <View accessibilityLabel="Everyday envelopes" onLayout={onLayout} style={styles.section}>
      <SectionHeader
        title="EVERYDAY"
        trailing={stale || lines.length === 0 ? undefined : everydayLeftLabel(lines, currency)}
      />
      {lines.length === 0 ? (
        <Text tone="secondary" variant="bodySm">
          No everyday envelopes yet.
        </Text>
      ) : (
        lines.map((line) => {
          const row = envelopeRowModel(line, { currency, daysLeft, pace, stale });
          const id = line.envelope.id;
          return (
            <EnvelopeRow
              key={id}
              accessibilityHint={onQuickAdd ? "Touch and hold to add spending" : undefined}
              accessibilityLabel={row.accessibilityLabel}
              emoji={emojiFor(line.envelope)}
              leftLabel={row.leftLabel}
              name={line.envelope.name}
              ofLabel={row.ofLabel}
              onLongPress={onQuickAdd ? () => onQuickAdd(id) : undefined}
              onPress={() => onOpen(id)}
              pace={row.pace}
              progress={row.progress}
              state={row.state}
              sub={row.sub}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 2 },
});
