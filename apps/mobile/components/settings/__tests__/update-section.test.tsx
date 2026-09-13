import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpdateSection } from "../update-section";

const mockCheckForUpdate = jest.fn();
const mockInstallUpdate = jest.fn();
const mockRetryMandatoryUpdate = jest.fn();
const mockUseAppUpdate = jest.fn();

jest.mock("@/hooks/use-app-update", () => ({
  useAppUpdate: () => mockUseAppUpdate(),
}));

jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));

function setUpdateState(overrides: Record<string, unknown> = {}) {
  mockUseAppUpdate.mockReturnValue({
    status: "current",
    isMandatory: false,
    checkForUpdate: mockCheckForUpdate,
    installUpdate: mockInstallUpdate,
    retryMandatoryUpdate: mockRetryMandatoryUpdate,
    ...overrides,
  });
}

describe("UpdateSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUpdateState();
  });

  it("shows the current state and lets the user check again", async () => {
    await render(<UpdateSection />);

    expect(screen.getByText("Trove is up to date")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Check for Update" }));
    expect(mockCheckForUpdate).toHaveBeenCalledTimes(1);
  });

  it("offers installation when an update is available", async () => {
    setUpdateState({ status: "available" });

    await render(<UpdateSection />);

    expect(screen.getByText("Update available")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Update Now" }));
    expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
  });

  it("shows download progress and disables another check", async () => {
    setUpdateState({ status: "downloading", progress: 0.42 });

    await render(<UpdateSection />);

    expect(screen.getByText("Keep Trove open while it downloads. 42%")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Check for Update" })).toBeDisabled();
  });

  it("shows update errors and keeps retrying available", async () => {
    setUpdateState({ status: "error", error: "Check your connection and try again." });

    await render(<UpdateSection />);

    expect(screen.getByText("Update check failed")).toBeOnTheScreen();
    expect(screen.getByText("Check your connection and try again.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Check for Update" }));
    expect(mockCheckForUpdate).toHaveBeenCalledTimes(1);
  });

  it("explains disabled updates without rendering actions", async () => {
    setUpdateState({ status: "disabled" });

    await render(<UpdateSection />);

    expect(screen.getByText("Updates unavailable")).toBeOnTheScreen();
    expect(screen.queryByRole("button")).not.toBeOnTheScreen();
  });
});
