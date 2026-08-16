import { fireEvent, render, screen } from "@testing-library/react-native";

import { JournalHeader } from "@/components/home/journal-header";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
}));

describe("JournalHeader", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("opens the full ledger", async () => {
    await render(<JournalHeader />);

    fireEvent.press(screen.getByRole("button", { name: "View all recent transactions" }));

    expect(mockPush).toHaveBeenCalledWith("/ledger");
  });
});
