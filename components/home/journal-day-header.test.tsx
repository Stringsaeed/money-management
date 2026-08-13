import { render, screen } from "@testing-library/react-native";

import { JournalDayHeader } from "@/components/home/journal-day-header";

describe("JournalDayHeader", () => {
  it("renders the header and net amount", async () => {
    await render(
      <JournalDayHeader
        item={{
          type: "section-header",
          date: "2026-03-28",
          totalIncome: 80_00,
          totalExpense: 30_00,
          currency: "USD",
        }}
      />,
    );

    expect(screen.getByText(/\+\$50.00/)).toBeOnTheScreen();
  });
});
