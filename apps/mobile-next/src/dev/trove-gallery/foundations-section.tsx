import { AmountSamples } from "./amount-samples";
import { CategoryTiles } from "./category-tiles";
import { GallerySection } from "./gallery-section";
import { IconGrid } from "./icon-grid";
import { TypeSamples } from "./type-samples";

export function FoundationsSection() {
  return (
    <GallerySection stamp="TYPOGRAPHY · ICONS · CATEGORIES" title="Foundations">
      <TypeSamples />
      <AmountSamples />
      <IconGrid />
      <CategoryTiles />
    </GallerySection>
  );
}
