import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";
import { TabBarDemo } from "./tab-bar-demo";

export function TabBarSection() {
  return (
    <GallerySection stamp="FLOATING TAB BAR" title="Tab bar">
      <GalleryGroup label="TAB BAR · TAP TABS, ACCOUNTS, ADD">
        <TabBarDemo />
      </GalleryGroup>
    </GallerySection>
  );
}
