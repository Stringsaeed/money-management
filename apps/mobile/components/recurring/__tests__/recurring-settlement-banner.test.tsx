// oxlint-disable anti-slop/no-module-mocking -- Jest owns expo-router and settlement provider boundaries.
import { act, render } from "@testing-library/react-native";
import { router } from "expo-router";

import { BANNER_TOAST_IDS, SUCCESS_TOAST_MS } from "@/components/banner/banner-channel";
import { RecurringSettlementBanner } from "@/components/recurring/recurring-settlement-banner";
import { toast } from "@/lib/sonner";

const mockDismiss = jest.fn();
const mockRetry = jest.fn().mockResolvedValue(undefined);
const mockUseFeedback = jest.fn();
// SAFETY: expo-router mock below installs push as a jest.fn.
const mockPush = router.push as jest.Mock;

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/components/recurring/recurring-settlement-provider", () => ({
  useRecurringSettlementFeedback: () => mockUseFeedback(),
}));

describe("RecurringSettlementBanner", () => {
  beforeEach(() => {
    mockDismiss.mockClear();
    mockPush.mockClear();
    mockRetry.mockClear();
  });

  it("presents an unresolved toast with retry and review actions", async () => {
    mockUseFeedback.mockReturnValue({
      dismiss: mockDismiss,
      error: new Error("settlement failed"),
      report: {
        startedAt: "2026-09-10T00:00:00.000Z",
        generatedCount: 0,
        rules: [{ kind: "needs_attention" }],
      },
      retry: mockRetry,
    });

    await render(<RecurringSettlementBanner />);

    expect(toast.error).toHaveBeenCalledWith(
      "Recurring Rules need attention",
      expect.objectContaining({
        id: BANNER_TOAST_IDS.settlement,
        duration: Number.POSITIVE_INFINITY,
        cancel: expect.objectContaining({ label: "Try again" }),
        action: expect.objectContaining({ label: "Review Rules" }),
      }),
    );

    // SAFETY: toast.error mock records ExternalToast with cancel/action onClick handlers.
    const options = (toast.error as jest.Mock).mock.calls[0]?.[1] as {
      cancel: { onClick: () => void };
      action: { onClick: () => void };
    };
    await act(async () => {
      options.cancel.onClick();
      await mockRetry.mock.results.at(-1)?.value;
    });
    options.action.onClick();

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring",
      params: { filter: "needs_attention" },
    });
  });

  it("presents a success toast that clears settlement feedback on auto-close", async () => {
    mockUseFeedback.mockReturnValue({
      dismiss: mockDismiss,
      error: null,
      report: {
        startedAt: "2026-09-10T00:00:00.000Z",
        generatedCount: 2,
        rules: [],
      },
      retry: mockRetry,
    });

    await render(<RecurringSettlementBanner />);

    expect(toast.success).toHaveBeenCalledWith(
      "Recurring transactions added",
      expect.objectContaining({
        id: BANNER_TOAST_IDS.settlement,
        description: "2 scheduled transactions were added.",
        duration: SUCCESS_TOAST_MS,
      }),
    );

    // SAFETY: toast.success mock records ExternalToast with onAutoClose.
    const options = (toast.success as jest.Mock).mock.calls[0]?.[1] as {
      onAutoClose: () => void;
    };
    await act(async () => {
      options.onAutoClose();
    });
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
