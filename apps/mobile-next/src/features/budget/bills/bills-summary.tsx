import { LeaderLine, RECEIPT_PADDING, ReceiptSlip } from "@/ui/trove";

export interface SummaryLine {
  readonly label: string;
  readonly value: string;
}

export interface BillsSummaryData {
  readonly lines: readonly SummaryLine[];
  /** The last line, set bold on the lime marker. */
  readonly total: SummaryLine;
}

type BillsSummaryProps = BillsSummaryData;

/** B1 receipt: what the tab adds up to, ending on its total. */
export function BillsSummary({ lines, total }: BillsSummaryProps) {
  return (
    <ReceiptSlip padding={RECEIPT_PADDING.screen} tearDepth={8}>
      {lines.map((line) => (
        <LeaderLine key={line.label} label={line.label} value={line.value} valueWeight="label" />
      ))}
      <LeaderLine
        label={total.label}
        marker
        value={total.value}
        valueWeight="label"
        weight="bold"
      />
    </ReceiptSlip>
  );
}
