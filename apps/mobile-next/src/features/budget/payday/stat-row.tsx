import { ListRow, Text } from "@/ui/trove";

interface StatRowProps {
  readonly label: string;
  readonly value: string;
  /** Negative value, for numbers that need a second look. */
  readonly warn?: boolean;
}

/** One label and value in a ListGroup, read as a single line by screen readers. */
export function StatRow({ label, value, warn = false }: StatRowProps) {
  return (
    <ListRow
      accessibilityLabel={`${label}, ${value}`}
      title={label}
      trailing={<Text tone={warn ? "negative" : "primary"}>{value}</Text>}
    />
  );
}
