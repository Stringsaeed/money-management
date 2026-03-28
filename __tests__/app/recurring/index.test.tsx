import { fireEvent, render, screen } from "@testing-library/react-native";

import RecurringListScreen from "@/app/recurring/index";
import {
  createAccount,
  createCategory,
  createRecurringPayment,
} from "@/tests/test-utils/factories";

const mockPush = jest.fn();
const mockUseRecurringPayments = jest.fn();
const mockUseAccounts = jest.fn();
const mockUseCategories = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock("@/hooks/use-recurring-payments", () => ({
  useRecurringPayments: () => mockUseRecurringPayments(),
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccounts: () => mockUseAccounts(),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => mockUseCategories(),
}));

jest.mock("@/components/common/empty-state", () => ({
  EmptyState: ({ title, action }: { title: string; action?: React.ReactNode }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Text, null, title),
      action,
    );
  },
}));

describe("app/recurring/index", () => {
  beforeEach(() => {
    mockUseAccounts.mockReturnValue({ data: [createAccount({ id: "account-1", name: "Wallet" })] });
    mockUseCategories.mockReturnValue({
      data: [createCategory({ id: "category-1", name: "Rent" })],
    });
  });

  it("renders the empty state", () => {
    mockUseRecurringPayments.mockReturnValue({ data: [], isLoading: false });

    render(<RecurringListScreen />);

    fireEvent.press(screen.getByText("Add Recurring"));

    expect(screen.getByText("No recurring payments")).toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith("/recurring/new");
  });

  it("renders recurring payments and routes to edit", () => {
    mockUseRecurringPayments.mockReturnValue({
      isLoading: false,
      data: [createRecurringPayment({ id: "recurring-1", name: "Rent" })],
    });

    render(<RecurringListScreen />);

    fireEvent.press(screen.getByText("Rent"));

    expect(screen.getByText(/Monthly/)).toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith("/recurring/recurring-1/edit");
  });
});
