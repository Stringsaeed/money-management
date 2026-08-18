import { render, screen } from "@testing-library/react-native";

import EnvelopesScreen from "@/app/(tabs)/envelopes";

describe("app/(tabs)/envelopes/index", () => {
  it("keeps the production Envelopes placeholder mounted", async () => {
    await render(<EnvelopesScreen />);

    expect(screen.getByText("Envelopes")).toBeOnTheScreen();
    expect(screen.getByText(/Budget envelopes are coming soon/)).toBeOnTheScreen();
  });
});
