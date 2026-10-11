import { StyleSheet, View } from "react-native";

import { EmptyState, space } from "@/ui/trove";

export type SearchMessageKind = "idle" | "empty" | "failed";

interface SearchMessageProps {
  readonly kind: SearchMessageKind;
  readonly onRetry?: () => void;
}

/** Before a search, when nothing matches, and when the search could not run. */
export function SearchMessage({ kind, onRetry }: SearchMessageProps) {
  return (
    <View style={styles.wrap}>
      {kind === "idle" ? (
        <EmptyState
          framed={false}
          icon="search"
          message="Type part of a note, like a shop or a person, or pick a filter above."
          title="Search the ledger"
        />
      ) : kind === "empty" ? (
        <EmptyState
          framed={false}
          icon="search"
          message="Nothing fits this search. Try fewer letters, a wider date, or fewer filters."
          title="Nothing matches"
        />
      ) : (
        <EmptyState
          actionLabel="Try again"
          framed={false}
          message="Check your connection and try again."
          onAction={onRetry}
          title="Search is unavailable"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: space[8] },
});
