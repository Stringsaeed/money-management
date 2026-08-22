import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EditAccountScreen from "@/app/account/[id]/edit";
import { createAccount } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseAccount = jest.fn();
const mockUpdateAccount = jest.fn();
const mockDeleteAccount = jest.fn();
const mockPreviewAccountDeletion = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: ({ onChange }: { onChange: (value: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChange("#F59E0B") },
      React.createElement(Text, null, "pick-color"),
    );
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccount: (...args: unknown[]) => mockUseAccount(...args),
  useUpdateAccount: () => ({ mutateAsync: mockUpdateAccount }),
  useDeleteAccount: () => ({ mutateAsync: mockDeleteAccount }),
  usePreviewAccountDeletion: () => ({ mutateAsync: mockPreviewAccountDeletion }),
}));

describe("app/account/[id]/edit", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ id: "account-1" });
    mockUseAccount.mockReturnValue({
      data: createAccount({ id: "account-1", name: "Wallet", color: "#8B9D83" }),
      isLoading: false,
    });
    mockUpdateAccount.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);
    mockPreviewAccountDeletion.mockResolvedValue({ accountId: "account-1", rules: [] });
  });

  it("validates, saves changes, and navigates back", async () => {
    await render(<EditAccountScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Wallet"), " ");
    await fireEvent.press(screen.getByText("Save Changes"));
    expect(await screen.findByText("Account name is required")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByDisplayValue(" "), "Travel Fund");
    await fireEvent.press(screen.getByText("pick-color"));
    await fireEvent.press(screen.getByText("Savings"));
    await fireEvent.press(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalledWith({
        id: "account-1",
        data: { name: "Travel Fund", type: "savings", color: "#F59E0B" },
      });
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it("confirms deletion and routes back to settings", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    await render(<EditAccountScreen />);

    await fireEvent.press(screen.getByText("Delete Account"));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.[1];
    await destructiveAction?.onPress?.();

    expect(mockDeleteAccount).toHaveBeenCalledWith("account-1");
    expect(mockReplace).toHaveBeenCalledWith("/settings");
  });
});
