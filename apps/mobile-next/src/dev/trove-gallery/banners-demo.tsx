import { Banner, showToast } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";

export function BannersDemo() {
  return (
    <GalleryGroup label="BANNER · WARNING, NEGATIVE + ACTION, NEUTRAL">
      <Banner
        message="You have used $470 of your $500 budget this month."
        title="Dining out is at 94%"
        tone="warning"
      />
      <Banner
        actionLabel="Reconnect"
        message="Reconnect your bank to keep balances up to date."
        onAction={() => showToast({ message: "Reconnecting..." })}
        title="Bank sync stopped"
        tone="negative"
      />
      <Banner message="Prices refresh every 15 minutes." tone="neutral" />
    </GalleryGroup>
  );
}
