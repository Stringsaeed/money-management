import { BalanceChart, CategoryBreakdown, ColumnChart, StatTile } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";
import {
  balanceSeries,
  dailySpending,
  EIGHT_CATEGORIES,
  GALLERY_CURRENCY,
  TREND,
} from "./sample-data";

export function ChartsSection() {
  return (
    <GallerySection stamp="STAT TILE · COLUMNS · LINE · BREAKDOWN" title="Charts">
      <GalleryGroup label="STAT TILE · SPENDING DOWN, INCOME UP">
        <StatTile
          changeLabel="vs Sep"
          changePercent={-8}
          currency={GALLERY_CURRENCY}
          label="Spent in October"
          minor={184230}
          trend={TREND}
        />
        <StatTile
          changeLabel="vs Sep"
          changePercent={4.2}
          currency={GALLERY_CURRENCY}
          label="Income in October"
          lessIsGood={false}
          minor={420000}
        />
      </GalleryGroup>
      <GalleryGroup label="COLUMN CHART · 14 DAYS">
        <ColumnChart currency={GALLERY_CURRENCY} data={dailySpending(14)} />
      </GalleryGroup>
      <GalleryGroup label="BALANCE CHART · 30 DAYS">
        <BalanceChart currency={GALLERY_CURRENCY} data={balanceSeries(30)} />
      </GalleryGroup>
      <GalleryGroup label="CATEGORY BREAKDOWN · 8 FOLD INTO OTHER">
        <CategoryBreakdown categories={EIGHT_CATEGORIES} currency={GALLERY_CURRENCY} />
      </GalleryGroup>
    </GallerySection>
  );
}
