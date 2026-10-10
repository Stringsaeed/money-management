import { StyleSheet, View } from "react-native";

import { Amount, Banner, Button, ListGroup, showToast, space } from "@/ui/trove";
import { MarketRow } from "@/ui/trove/market";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";
import { GallerySection } from "./gallery-section";
import { MARKET_SAMPLES } from "./gaps-feedback-samples";

export function GapsFeedbackSection() {
  return (
    <GallerySection stamp="GAPS · FEEDBACK & MARKET" title="Feedback and market">
      <GalleryGroup label="EMOJI TOAST · ONE HOST COVERS EVERY CASE">
        <GalleryRow>
          <Button
            label="Emoji + action"
            onPress={() =>
              showToast({
                action: { label: "Change", onPress: () => showToast({ message: "Changed" }) },
                emoji: "✨",
                emphasis: "Groceries",
                message: "Filed under Groceries",
              })
            }
            variant="secondary"
          />
          <Button
            label="Emoji only"
            onPress={() => showToast({ emoji: "🧾", message: "First entry printed" })}
            variant="secondary"
          />
        </GalleryRow>
      </GalleryGroup>
      <GalleryGroup label="BANNER TONES · POSITIVE IS NEW">
        <Banner
          message="Market prices are for reference, not trading."
          title="Rates update every 15 minutes"
          tone="neutral"
        />
        <Banner
          message="Dining out is at 82% after the refund."
          title="Back under budget"
          tone="positive"
        />
        <Banner
          message="Your account has enough to cover it."
          title="Rent is due in 2 days"
          tone="warning"
        />
        <Banner
          message="Right has not updated since Oct 6."
          title="Bank sync stopped"
          tone="negative"
        />
      </GalleryGroup>
      <GalleryGroup label="AMOUNT · SIGNIFICANT DECIMALS">
        <View style={styles.stack}>
          <Amount currency="USD" significant={4} value="0.00001842" />
          <Amount currency="USD" value="61240.18" />
          <Amount currency="USD" value="0.1834" />
          <Amount currency="USD" size="lg" value="0.00001842" />
          <Amount currency="USD" isoCode value="0.00001842" />
        </View>
      </GalleryGroup>
      <GalleryGroup label="MARKET ROWS · SUB-CENT PRICES · USD 24H">
        <ListGroup dividerInset={0}>
          {MARKET_SAMPLES.map((sample) => (
            <MarketRow key={sample.symbol} {...sample} sparkline={[...sample.sparkline]} />
          ))}
        </ListGroup>
      </GalleryGroup>
    </GallerySection>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[2] },
});
