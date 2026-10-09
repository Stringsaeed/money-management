import { BannersDemo } from "./banners-demo";
import { EmptyAndSkeletonDemo } from "./empty-and-skeleton-demo";
import { GallerySection } from "./gallery-section";
import { OverlaysDemo } from "./overlays-demo";

export function FeedbackSection() {
  return (
    <GallerySection stamp="BANNERS · EMPTY · SKELETON · DIALOG · TOAST" title="Feedback">
      <BannersDemo />
      <EmptyAndSkeletonDemo />
      <OverlaysDemo />
    </GallerySection>
  );
}
