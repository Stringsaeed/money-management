import { waitFor } from "@testing-library/react-native";

import { useActivity } from "@/hooks/use-activity";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockList = jest.fn();

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    activity: { list: (...args: unknown[]) => mockList(...args) },
  },
}));

const HOUSEHOLD_ID = "household-1";
const PAGE = {
  hasMore: false,
  changes: [
    {
      seq: 2,
      commandId: "cmd-2",
      userId: "user-2",
      userName: "Member",
      createdAt: "2026-08-24T12:00:00.000Z",
      effects: ["members"],
      summary: "Updated household members",
    },
  ],
};

describe("useActivity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue(PAGE);
  });

  it("fetches the default page for the household", async () => {
    const { result } = await renderHookWithProviders(() => useActivity(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(mockList).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID, limit: 50 });
    expect(result.current.data?.changes[0]?.userName).toBe("Member");
    expect(result.current.data?.hasMore).toBe(false);
  });

  it("stays idle without a household", async () => {
    const { result } = await renderHookWithProviders(() => useActivity(null));
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    expect(mockList).not.toHaveBeenCalled();
  });

  it("passes user and date-range filters through", async () => {
    const { result } = await renderHookWithProviders(() =>
      useActivity(
        HOUSEHOLD_ID,
        { userId: "user-2", fromDate: "2026-08-01", toDate: "2026-08-24" },
        25,
      ),
    );
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(mockList).toHaveBeenCalledWith({
      householdId: HOUSEHOLD_ID,
      limit: 25,
      userId: "user-2",
      from: "2026-08-01",
      to: "2026-08-24",
    });
  });
});
