import { BalanceCard } from "@/ui/trove";

import { CardElevations } from "./card-elevations";
import { DeltaBadges } from "./delta-badges";
import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";
import { KeypadDemo } from "./keypad-demo";
import { ListGroupDemo } from "./list-group-demo";
import { GALLERY_CURRENCY } from "./sample-data";
import { TransactionsDemo } from "./transactions-demo";

export function DataSection() {
  return (
    <GallerySection stamp="DATA DISPLAY · LISTS · KEYPAD" title="Data display">
      <GalleryGroup label="BALANCE CARD">
        <BalanceCard
          caption="this month · 3 accounts"
          currency={GALLERY_CURRENCY}
          deltaMinor={32014}
          label="Total balance"
          minor={1284503}
        />
      </GalleryGroup>
      <DeltaBadges />
      <TransactionsDemo />
      <ListGroupDemo />
      <CardElevations />
      <KeypadDemo />
    </GallerySection>
  );
}
