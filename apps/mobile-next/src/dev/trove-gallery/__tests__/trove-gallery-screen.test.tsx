import { render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TroveGalleryScreen } from "../trove-gallery-screen";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("TroveGalleryScreen", () => {
  it("renders the header and every section", async () => {
    await render(
      <GestureHandlerRootView>
        <SafeAreaProvider initialMetrics={METRICS}>
          <TroveGalleryScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>,
    );

    expect(screen.getByText("Trove gallery")).toBeTruthy();
    for (const title of [
      "Foundations",
      "Controls",
      "Data display",
      "Navigation",
      "Feedback",
      "Charts",
      "Tab bar",
    ]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});
