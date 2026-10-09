import { ButtonsShowcase } from "./buttons-showcase";
import { FieldsShowcase } from "./fields-showcase";
import { GallerySection } from "./gallery-section";
import { TogglesShowcase } from "./toggles-showcase";

export function ControlsSection() {
  return (
    <GallerySection stamp="BUTTONS · INPUTS · TOGGLES" title="Controls">
      <ButtonsShowcase />
      <FieldsShowcase />
      <TogglesShowcase />
    </GallerySection>
  );
}
