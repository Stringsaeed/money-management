import { Amount, DeltaBadge } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";
import { GALLERY_CURRENCY } from "./sample-data";

export function DeltaBadges() {
  return (
    <GalleryGroup label="DELTA BADGE · POSITIVE NEGATIVE NEUTRAL WARNING">
      <GalleryRow>
        <DeltaBadge percent={2.6} />
        <DeltaBadge percent={-1.1} />
        <DeltaBadge percent={0} />
        <DeltaBadge label="94% used" tone="warning" />
        <DeltaBadge tone="positive">
          <Amount
            currency={GALLERY_CURRENCY}
            minor={32014}
            signDisplay="always"
            size="sm"
            tone="positive"
          />
        </DeltaBadge>
      </GalleryRow>
    </GalleryGroup>
  );
}
