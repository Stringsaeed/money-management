import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EditRecurringScreen from "@/app/recurring/[id]/edit";
import { createAccount, createRecurringPayment } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseAccounts = jest.fn();
const mockUseRecurringPayment = jest.fn();
const mockUpdateRecurring = jest.fn();
const mockDeleteRecurring = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/components/account/account-picker", () => ({
  AccountPicker: ({ onChange }: { onChange: (value: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChange("account-2") },
      React.createElement(Text, null, "pick-account"),
    );
  },
}));

jest.mock("@/components/common/amount-input", () => ({
  AmountInput: ({ onChangeCents }: { onChangeCents: (value: number) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChangeCents(33_00) },
      React.createElement(Text, null, "set-amount"),
    );
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccounts: () => mockUseAccounts(),
}));

jest.mock("@/hooks/use-recurring-payments", () => ({
  useRecurringPayment: (...args: unknown[]) => mockUseRecurringPayment(...args),
  useUpdateRecurringPayment: () => ({ mutateAsync: mockUpdateRecurring }),
  useDeleteRecurringPayment: () => ({ mutateAsync: mockDeleteRecurring }),
}));

describe("app/recurring/[id]/edit", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ id: "recurring-1" });
    mockUseAccounts.mockReturnValue({
      data: [
        createAccount({ id: "account-1", currency: "USD" }),
        createAccount({ id: "account-2", currency: "EUR" }),
      ],
    });
    mockUseRecurringPayment.mockReturnValue({
      data: createRecurringPayment({
        id: "recurring-1",
        name: "Rent",
        accountId: "account-1",
        amount: 12_00,
        interval: "monthly",
      }),
      isLoading: false,
    });
    mockUpdateRecurring.mockResolvedValue(undefined);
    mockDeleteRecurring.mockResolvedValue(undefined);
  });

  it("validates and saves recurring edits", async () => {
    await render(<EditRecurringScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Rent"), " ");
    await fireEvent.press(screen.getByText("Save Changes"));
    expect(await screen.findByText("Name is required")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByDisplayValue(" "), "Gym");
    await fireEvent.press(screen.getByText("pick-account"));
    await fireEvent.press(screen.getByText("set-amount"));
    await fireEvent(screen.getByRole("switch"), "valueChange", false);
    await fireEvent.press(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateRecurring).toHaveBeenCalledWith({
        id: "recurring-1",
        data: { name: "Gym", amount: 33_00, accountId: "account-2", isActive: false },
      });
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it("confirms deletion", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    await render(<EditRecurringScreen />);

    await fireEvent.press(screen.getByText("Delete Recurring Payment"));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.[1];
    await destructiveAction?.onPress?.();

    expect(mockDeleteRecurring).toHaveBeenCalledWith("recurring-1");
    expect(mockBack).toHaveBeenCalled();
  });
});
