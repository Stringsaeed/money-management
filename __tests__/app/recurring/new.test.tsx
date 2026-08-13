import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import NewRecurringScreen from "@/app/recurring/new";
import { createAccount } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockUseAccounts = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
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

jest.mock("@/components/category/category-picker", () => ({
  CategoryPicker: ({ onChange }: { onChange: (value: string | null) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChange("category-2") },
      React.createElement(Text, null, "pick-category"),
    );
  },
}));

jest.mock("@/components/common/amount-input", () => ({
  AmountInput: ({ onChangeCents }: { onChangeCents: (value: number) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChangeCents(25_00) },
      React.createElement(Text, null, "set-amount"),
    );
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccounts: () => mockUseAccounts(),
}));

jest.mock("@/hooks/use-recurring-payments", () => ({
  useCreateRecurringPayment: () => ({ mutateAsync: mockMutateAsync }),
}));

describe("app/recurring/new", () => {
  beforeEach(() => {
    mockUseAccounts.mockReturnValue({
      data: [
        createAccount({ id: "account-1", currency: "USD" }),
        createAccount({ id: "account-2", currency: "EUR" }),
      ],
    });
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it("validates the name before creating", async () => {
    await render(<NewRecurringScreen />);

    await fireEvent.press(screen.getByText("Create Recurring Payment"));

    expect(await screen.findByText("Name is required")).toBeOnTheScreen();
  });

  it("creates a recurring payment and navigates back", async () => {
    await render(<NewRecurringScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Netflix, Rent"), "Rent");
    await fireEvent.press(screen.getByText("Income"));
    await fireEvent.press(screen.getByText("pick-account"));
    await fireEvent.press(screen.getByText("pick-category"));
    await fireEvent.press(screen.getByText("set-amount"));
    await fireEvent.changeText(screen.getByPlaceholderText("1"), "9");
    await fireEvent.changeText(screen.getByPlaceholderText("Add a note…"), "Monthly");
    await fireEvent.press(screen.getByText("Create Recurring Payment"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Rent",
          type: "income",
          amount: 25_00,
          accountId: "account-2",
          categoryId: "category-2",
          currency: "EUR",
          dayOfMonth: 9,
          description: "Monthly",
        }),
      );
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
