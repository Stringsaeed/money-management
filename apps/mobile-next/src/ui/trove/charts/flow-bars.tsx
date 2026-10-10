import { ColumnBar } from "./column-bar";
import { FLOW_BAR_GAP, FLOW_PLOT_HEIGHT } from "./constants";
import { FLOW_EXPENSE_COLOR, FLOW_INCOME_COLOR } from "./flow-series";
import { flowBarWidth, type FlowDatumLike, type FlowScale } from "./flow-chart-utils";

export interface FlowBarsProps {
  data: readonly FlowDatumLike[];
  scale: FlowScale;
  plotWidth: number;
}

/** A pair of columns per period: income then spending, 4pt rounded tops on the baseline. */
export function FlowBars({ data, scale, plotWidth }: FlowBarsProps) {
  const cell = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = flowBarWidth(cell);
  const pairWidth = barWidth * 2 + FLOW_BAR_GAP;

  return (
    <>
      {data.map((datum, index) => {
        const left = cell * (index + 0.5) - pairWidth / 2;
        return (
          <FlowBarPair
            barWidth={barWidth}
            expenseHeight={scale.expenseHeights[index] ?? 0}
            incomeHeight={scale.incomeHeights[index] ?? 0}
            key={datum.label}
            left={left}
          />
        );
      })}
    </>
  );
}

interface FlowBarPairProps {
  left: number;
  barWidth: number;
  incomeHeight: number;
  expenseHeight: number;
}

function FlowBarPair({ left, barWidth, incomeHeight, expenseHeight }: FlowBarPairProps) {
  return (
    <>
      <ColumnBar
        baselineY={FLOW_PLOT_HEIGHT}
        color={FLOW_INCOME_COLOR}
        height={incomeHeight}
        highlighted={false}
        left={left}
        width={barWidth}
      />
      <ColumnBar
        baselineY={FLOW_PLOT_HEIGHT}
        color={FLOW_EXPENSE_COLOR}
        height={expenseHeight}
        highlighted={false}
        left={left + barWidth + FLOW_BAR_GAP}
        width={barWidth}
      />
    </>
  );
}
