import { fireEvent, render, screen } from "@testing-library/react-native";

import { MandatoryUpdateGate } from "../mandatory-update-gate";

const mockRetryMandatoryUpdate = jest.fn();
const mockUseAppUpdate = jest.fn();

jest.mock("@/hooks/use-app-update", () => ({
  useAppUpdate: () => mockUseAppUpdate(),
}));

describe("MandatoryUpdateGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppUpdate.mockReturnValue({
      status: "current",
      isMandatory: false,
      retryMandatoryUpdate: mockRetryMandatoryUpdate,
    });
  });

  it("stays hidden for optional update states", async () => {
    await render(<MandatoryUpdateGate />);

    expect(screen.queryByText("Update required")).not.toBeOnTheScreen();
  });

  it("blocks the app and reports mandatory download progress", async () => {
    mockUseAppUpdate.mockReturnValue({
      status: "downloading",
      isMandatory: true,
      progress: 0.58,
      retryMandatoryUpdate: mockRetryMandatoryUpdate,
    });

    await render(<MandatoryUpdateGate />);

    expect(screen.getByText("Update required")).toBeOnTheScreen();
    expect(screen.getByText("Downloading 58%")).toBeOnTheScreen();
  });

  it("shows the failure and retries a mandatory update", async () => {
    mockUseAppUpdate.mockReturnValue({
      status: "error",
      isMandatory: true,
      error: "The update could not be downloaded.",
      retryMandatoryUpdate: mockRetryMandatoryUpdate,
    });

    await render(<MandatoryUpdateGate />);

    expect(screen.getByText("The update could not be downloaded.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Retry Update" }));
    expect(mockRetryMandatoryUpdate).toHaveBeenCalledTimes(1);
  });
});
