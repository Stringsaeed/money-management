import { Text } from "@/ui/trove";

interface CoverNotesProps {
  /** What the move leaves behind; null until something is covered. */
  readonly afterLine: string | null;
  /** What a partial cover leaves uncovered, or a prompt to pick a source; null when not needed. */
  readonly restLine: string | null;
}

/** Under the sources: what the move leaves, and what a partial cover does not reach. */
export function CoverNotes({ afterLine, restLine }: CoverNotesProps) {
  return (
    <>
      {afterLine ? (
        <Text variant="labelSm" tone="secondary" accessibilityLiveRegion="polite">
          {afterLine}
        </Text>
      ) : null}
      {restLine ? (
        <Text variant="bodySm" tone="secondary" accessibilityLiveRegion="polite">
          {restLine}
        </Text>
      ) : null}
    </>
  );
}
