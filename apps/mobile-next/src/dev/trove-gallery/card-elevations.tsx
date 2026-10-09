import { Card, Text, type ElevationLevel } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";

const LEVELS = [
  "level0",
  "level1",
  "level2",
  "level3",
] as const satisfies readonly ElevationLevel[];

export function CardElevations() {
  return (
    <GalleryGroup label="CARD · ELEVATION LEVELS">
      {LEVELS.map((level) => (
        <Card elevation={level} key={level}>
          <Text variant="labelMd">{`Card ${level}`}</Text>
        </Card>
      ))}
    </GalleryGroup>
  );
}
