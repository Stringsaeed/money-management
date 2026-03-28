import { Alert } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";

import TransactionScreen from "@/app/transaction/[id]";
import type { TransactionFormData } from "@/components/transaction/types";

const mockUseLocalSearchParams = jest.fn();
const mockUseRouter = jest.fn();
const mockUseTransaction = jest.fn();
const mockCreateTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransaction = jest.fn();
const mockStackScreen = jest.fn((_: unknown) => null);

let capturedFormProps: {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  formRef?: React.MutableRefObject<{ submit: () => void } | null>;
  initialData?: Partial<TransactionFormData>;
} | null = null;

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: unknown) => mockStackScreen(props),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => mockUseRouter(),
}));

jest.mock("@/components/transaction/transaction-form", () => ({
  TransactionForm: (props: typeof capturedFormProps) => {
    const React = require("react");
    const { Text } = require("react-native");

    capturedFormProps = props;
    return React.createElement(Text, null, "transaction-form");
  },
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransaction: (...args: unknown[]) => mockUseTransaction(...args),
  useCreateTransaction: () => ({ mutateAsync: mockCreateTransaction }),
  useUpdateTransaction: () => ({ mutateAsync: mockUpdateTransaction }),
  useDeleteTransaction: () => ({ mutateAsync: mockDeleteTransaction }),
}));

describe("app/transaction/[id]", () => {
  const baseRouter = {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    canDismiss: jest.fn(() => false),
    dismiss: jest.fn(),
  };

  beforeEach(() => {
    capturedFormProps = null;
    mockUseRouter.mockReturnValue(baseRouter);
  });

  it("renders new-entry mode and creates a transaction", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "new" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: false });

    render(<TransactionScreen />);

    const screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: { title: string };
    };

    expect(screenCall.options.title).toBe("New Entry");
    expect(capturedFormProps).not.toBeNull();

    await act(async () => {
      await capturedFormProps?.onSubmit({
        type: "expense",
        amount: 10_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Coffee",
        date: new Date("2026-03-28T00:00:00.000Z"),
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      });
    });

    expect(mockCreateTransaction).toHaveBeenCalled();
    expect(baseRouter.back).toHaveBeenCalled();
  });

  it("renders loading state while fetching an existing transaction", () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "transaction-1" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: true });

    const { queryByText } = render(<TransactionScreen />);

    expect(queryByText("transaction-form")).not.toBeOnTheScreen();
  });

  it("updates an existing transaction", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "transaction-1" });
    mockUseTransaction.mockReturnValue({
      isLoading: false,
      data: {
        id: "transaction-1",
        type: "expense",
        amount: 10_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Coffee",
        date: "2026-03-28",
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      },
    });

    render(<TransactionScreen />);

    await act(async () => {
      await capturedFormProps?.onSubmit({
        type: "expense",
        amount: 25_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Dinner",
        date: new Date("2026-03-28T00:00:00.000Z"),
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      });
    });

    expect(mockUpdateTransaction).toHaveBeenCalledWith({
      id: "transaction-1",
      data: expect.objectContaining({
        amount: 25_00,
        description: "Dinner",
        date: "2026-03-28",
      }),
    });
  });

  it("prompts before deleting an existing transaction", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    mockUseLocalSearchParams.mockReturnValue({ id: "transaction-1" });
    mockUseTransaction.mockReturnValue({
      isLoading: false,
      data: {
        id: "transaction-1",
        type: "expense",
        amount: 10_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Coffee",
        date: "2026-03-28",
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      },
    });

    render(<TransactionScreen />);

    const screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: { unstable_headerRightItems: () => { label: string; onPress: () => void }[] };
    };
    const deleteButton = screenCall.options.unstable_headerRightItems()[0];

    deleteButton?.onPress();

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.[1];
    await act(async () => {
      await destructiveAction?.onPress?.();
    });

    await waitFor(() => {
      expect(mockDeleteTransaction).toHaveBeenCalledWith("transaction-1");
    });

    expect(baseRouter.back).toHaveBeenCalled();
  });
});
