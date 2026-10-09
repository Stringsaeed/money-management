import { Header, showToast } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";

const announce = (message: string) => () => showToast({ message });

export function HeadersDemo() {
  return (
    <>
      <GalleryGroup label="HEADER · LARGE">
        <Header
          actions={[
            { icon: "search", label: "Search", onPress: announce("Search") },
            { icon: "filter", label: "Filter", onPress: announce("Filter") },
          ]}
          title="Ledger"
        />
      </GalleryGroup>
      <GalleryGroup label="HEADER · COMPACT">
        <Header
          actions={[{ icon: "more", label: "More", onPress: announce("More") }]}
          onBack={announce("Back")}
          title="Fresh Market"
          variant="compact"
        />
      </GalleryGroup>
    </>
  );
}
