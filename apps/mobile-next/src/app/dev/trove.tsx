import { Redirect, useLocalSearchParams } from "expo-router";

import { TroveGalleryScreen } from "@/dev/trove-gallery/trove-gallery-screen";

/**
 * Dev-only Trove component gallery, reachable at `trove-next://dev/trove`.
 * Add `?section=controls` (foundations, controls, data, navigation, feedback, charts, tab-bar)
 * to show one section.
 */
export default function TroveGalleryRoute() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  if (!__DEV__) return <Redirect href="/" />;
  return <TroveGalleryScreen section={section} />;
}
