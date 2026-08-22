import { Alert } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DevToolsSection } from "./dev-tools-section";

const mockCohereLedgerCache = jest.fn();
const mockSeedDatabase = jest.fn();
const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/db/seed", () => ({
  seedDatabase: (...args: unknown[]) => mockSeedDatabase(...args),
}));

jest.mock("@/modules/ledger-cache", () => ({
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

jest.mock("expo-updates", () => ({
  channel: null,
}));

describe("DevToolsSection", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    mockCohereLedgerCache.mockReset().mockResolvedValue(undefined);
    mockSeedDatabase.mockReset().mockResolvedValue(undefined);
    mockUseDatabase.mockReturnValue("database");
  });

  it("reports a Category batch after forced seeding and keeps its success feedback", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    await render(
      <QueryClientProvider client={queryClient}>
        <DevToolsSection />
      </QueryClientProvider>,
    );
    await fireEvent.press(screen.getByText("Run Seed Data"));

    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(expect.anything(), {
        kind: "category.batch",
      });
    });

    expect(mockSeedDatabase).toHaveBeenCalledWith("database", { force: true });
    expect(mockSeedDatabase.mock.invocationCallOrder[0]).toBeLessThan(
      mockCohereLedgerCache.mock.invocationCallOrder[0]!,
    );
    expect(alertSpy).toHaveBeenCalledWith("Done", "Seed data has been inserted.");
  });

  it("keeps its existing error feedback when forced seeding fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockSeedDatabase.mockRejectedValueOnce(new Error("seed failure"));

    await render(
      <QueryClientProvider client={queryClient}>
        <DevToolsSection />
      </QueryClientProvider>,
    );
    await act(async () => {
      await fireEvent.press(screen.getByText("Run Seed Data"));
    });

    expect(mockCohereLedgerCache).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to seed data — data may already exist.");
  });
});
