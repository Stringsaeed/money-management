import { format, parseISO } from "date-fns";
import type { FlowChartDatum } from "@/ui/trove";

import type { HomeOverview, HomeOverviewRange } from "./home-model-types";

const DAYS_PER_BUCKET = 7;

/**
 * Income-versus-spending buckets for the Trove `FlowChart`. Labels must stay short and unique:
 * a week plots its days, a month plots weeks (labelled by their first day), a year plots months.
 */
export function homeFlowData(
  overview: HomeOverview,
  range: HomeOverviewRange,
): readonly FlowChartDatum[] {
  if (range === "month") return weeklyBuckets(overview.points);
  const pattern = range === "year" ? "MMM" : "EEE";
  return overview.points.map((point) => ({
    label: format(parseISO(point.date), pattern),
    incomeMinor: point.incomeMinor,
    expenseMinor: point.expenseMinor,
  }));
}

function weeklyBuckets(points: HomeOverview["points"]): readonly FlowChartDatum[] {
  const buckets: FlowChartDatum[] = [];
  for (let index = 0; index < points.length; index += DAYS_PER_BUCKET) {
    const slice = points.slice(index, index + DAYS_PER_BUCKET);
    const first = slice[0];
    if (!first) continue;
    buckets.push({
      label: format(parseISO(first.date), "d"),
      incomeMinor: slice.reduce((total, point) => total + point.incomeMinor, 0),
      expenseMinor: slice.reduce((total, point) => total + point.expenseMinor, 0),
    });
  }
  return buckets;
}

/** Stamp over the chart title, e.g. `1 SEP – 15 SEP · USD`. */
export function homeFlowRangeLabel(overview: HomeOverview): string {
  const from = format(parseISO(overview.startDate), "d MMM");
  const to = format(parseISO(overview.endDate), "d MMM");
  return `${from} – ${to} · ${overview.currency}`.toUpperCase();
}
