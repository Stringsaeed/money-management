import {
  CategoryTile,
  DateChip,
  dueInLabel,
  FlowChart,
  ListGroup,
  ListRow,
  nextUpcomingIndex,
  SoonBadge,
  UpcomingRow,
  type FlowChartDatum,
} from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";
import { noop } from "./utils";

const CURRENCY = "AED";
const TODAY = "2026-10-10";

/** May to October: steady salary against uneven spending, in fils. */
const FLOW_DATA = [
  { label: "May", incomeMinor: 1_200_000, expenseMinor: 840_000 },
  { label: "Jun", incomeMinor: 1_200_000, expenseMinor: 910_000 },
  { label: "Jul", incomeMinor: 1_250_000, expenseMinor: 760_000 },
  { label: "Aug", incomeMinor: 1_200_000, expenseMinor: 1_020_000 },
  { label: "Sep", incomeMinor: 1_320_000, expenseMinor: 880_000 },
  { label: "Oct", incomeMinor: 1_200_000, expenseMinor: 428_600 },
] as const satisfies readonly FlowChartDatum[];

const UPCOMING = [
  { date: "2026-10-12", emoji: "🏠", title: "Rent", minor: -650_000 },
  { date: "2026-10-15", emoji: "📱", title: "Phone plan", minor: -19_900 },
  { date: "2026-10-25", emoji: "💼", title: "Salary", minor: 1_200_000 },
] as const;

const NEXT_INDEX = nextUpcomingIndex(
  UPCOMING.map((item) => item.date),
  TODAY,
);

/** Home pieces: FlowChart, UpcomingRow, DateChip, SoonBadge. */
export function GapsHomeSection() {
  return (
    <GallerySection stamp="GAPS · HOME" title="Home pieces">
      <GalleryGroup label="FLOW CHART · BAR (DEFAULT)">
        <FlowChart currency={CURRENCY} data={FLOW_DATA} />
      </GalleryGroup>
      <GalleryGroup label="FLOW CHART · LINE">
        <FlowChart currency={CURRENCY} data={FLOW_DATA} defaultView="line" />
      </GalleryGroup>
      <GalleryGroup label="UPCOMING · DATE CHIP">
        <ListGroup dividerInset={74}>
          {UPCOMING.map((item, index) => (
            <UpcomingRow
              currency={CURRENCY}
              date={item.date}
              emoji={item.emoji}
              key={item.title}
              minor={item.minor}
              next={index === NEXT_INDEX}
              onPress={noop}
              subtitle={`${dueInLabel(item.date, TODAY)} · RECURRING`}
              title={item.title}
            />
          ))}
        </ListGroup>
        <DateChip date="2026-12-03" />
      </GalleryGroup>
      <GalleryGroup label="COMING SOON BADGE">
        <ListGroup dividerInset={68}>
          <ListRow
            accessibilityLabel="Budgets, Set a limit per category, coming soon. Opens Notify me."
            leading={<CategoryTile icon="📊" />}
            onPress={noop}
            subtitle="Set a limit per category"
            title="Budgets"
            trailing={<SoonBadge />}
          />
        </ListGroup>
        <SoonBadge compact />
      </GalleryGroup>
    </GallerySection>
  );
}
