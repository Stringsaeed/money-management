import { useState } from "react";

import { Chip, SegmentedControl, showToast } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";
import { FILTER_CHIPS, SEGMENT_OPTIONS } from "./sample-data";

type SegmentValue = (typeof SEGMENT_OPTIONS)[number]["value"];

export function FiltersDemo() {
  const [segment, setSegment] = useState<SegmentValue>("all");
  const [chip, setChip] = useState<string>("All");
  const [underFifty, setUnderFifty] = useState(true);

  return (
    <>
      <GalleryGroup label="SEGMENTED CONTROL">
        <SegmentedControl
          accessibilityLabel="Transaction type"
          onChange={setSegment}
          options={SEGMENT_OPTIONS}
          value={segment}
        />
      </GalleryGroup>
      <GalleryGroup label="CHIPS · SELECTABLE + REMOVABLE">
        <GalleryRow>
          {FILTER_CHIPS.map((label) => (
            <Chip
              key={label}
              label={label}
              onPress={() => setChip(label)}
              selected={chip === label}
            />
          ))}
          <Chip
            label="Under $50"
            onPress={() => setUnderFifty((current) => !current)}
            onRemove={() => showToast({ message: "Filter removed" })}
            selected={underFifty}
          />
        </GalleryRow>
      </GalleryGroup>
    </>
  );
}
