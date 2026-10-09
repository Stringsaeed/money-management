import { FiltersDemo } from "./filters-demo";
import { GallerySection } from "./gallery-section";
import { HeadersDemo } from "./headers-demo";
import { SheetDemo } from "./sheet-demo";

export function NavigationSection() {
  return (
    <GallerySection stamp="HEADERS · SEGMENTS · CHIPS · SHEET" title="Navigation">
      <HeadersDemo />
      <FiltersDemo />
      <SheetDemo />
    </GallerySection>
  );
}
