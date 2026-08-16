import { Alert } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";

import TransactionScreen from "@/app/transaction/[id]";
import type { TransactionFormData } from "@/components/transaction/types";

const mockUseLocalSearchParams = jest.fn();
const mockUseRouter = jest.fn();
const mockUseTransaction = jest.fn();
const mockCreateTransaction = jest.fn();
const mockCreateRecurring = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransaction = jest.fn();
const mockStackScreen = jest.fn((_: unknown) => null);

let capturedFormProps: {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  formRef?: React.MutableRefObject<{ submit: () => void } | null>;
  initialData?: Partial<TransactionFormData>;
  isRecurring: boolean;
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

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({ data: [] }),
}));

jest.mock("@/hooks/use-recurring-rules", () => ({
  useCreateRecurringRule: () => ({ mutateAsync: mockCreateRecurring }),
}));

jest.mock("@/modules/recurring-rules/clock", () => ({
  getSystemTimeZone: () => "Asia/Dubai",
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
    mockCreateRecurring.mockResolvedValue({
      kind: "applied",
      ruleId: "recurring-1",
      revision: 1,
      settlement: { generatedCount: 0, totalMinor: 0 },
      effects: ["rules"],
    });
  });

  it("renders new-entry mode and creates a transaction", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "new" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: false });

    await render(<TransactionScreen />);

    const screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: { title: string };
    };

    expect(screenCall.options.title).toBe("");
    expect(capturedFormProps).not.toBeNull();

    await act(async () => {
      await capturedFormProps?.onSubmit({
        type: "expense",
        amount: 10_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        isRecurring: false,
        description: "Coffee",
        date: new Date("2026-03-28T00:00:00.000Z"),
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        recurrence: { frequency: "month", intervalCount: 1, endDate: null, endCount: null },
      });
    });

    expect(mockCreateTransaction).toHaveBeenCalled();
    expect(mockCreateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ isRecurring: false }),
    );
    expect(baseRouter.back).toHaveBeenCalled();
  });

  it("toggles between one-time and recurring, revealing the recurrence fields", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "new" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: false });

    await render(<TransactionScreen />);

    let screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: {
        unstable_headerRightItems: () => {
          icon: { name: string };
          label: string;
          onPress: () => void;
        }[];
      };
    };

    expect(capturedFormProps?.isRecurring).toBe(false);
    expect(screenCall.options.unstable_headerRightItems()[0]).toMatchObject({
      label: "Make recurring",
      icon: { name: "1.circle" },
    });

    await act(async () => {
      screenCall.options.unstable_headerRightItems()[0]?.onPress();
    });

    screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as typeof screenCall;
    expect(capturedFormProps?.isRecurring).toBe(true);
    expect(screenCall.options.unstable_headerRightItems()[0]).toMatchObject({
      label: "Make one-time",
      icon: { name: "repeat.circle" },
    });
  });

  it("creates a Recurring Rule when saved in recurring mode", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "new", recurring: "true" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: false });

    await render(<TransactionScreen />);

    expect(capturedFormProps?.isRecurring).toBe(true);

    await act(async () => {
      await capturedFormProps?.onSubmit({
        type: "expense",
        amount: 1200_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        isRecurring: true,
        description: "Rent",
        date: new Date("2026-03-28T00:00:00.000Z"),
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        recurrence: { frequency: "month", intervalCount: 1, endDate: null, endCount: null },
      });
    });

    expect(mockCreateRecurring).toHaveBeenCalledWith({
      rule: expect.objectContaining({
        name: "Rent",
        frequency: "month",
        intervalCount: 1,
        startDate: "2026-03-28",
        endDate: null,
        endCount: null,
        timeZone: "Asia/Dubai",
      }),
      confirmationToken: undefined,
    });
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("renders loading state while fetching an existing transaction", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "transaction-1" });
    mockUseTransaction.mockReturnValue({ data: undefined, isLoading: true });

    const { queryByText } = await render(<TransactionScreen />);

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
        isRecurring: true,
        description: "Coffee",
        date: "2026-03-28",
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      },
    });

    await render(<TransactionScreen />);

    await act(async () => {
      await capturedFormProps?.onSubmit({
        type: "expense",
        amount: 25_00,
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        isRecurring: true,
        description: "Dinner",
        date: new Date("2026-03-28T00:00:00.000Z"),
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        recurrence: { frequency: "month", intervalCount: 1, endDate: null, endCount: null },
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
        isRecurring: false,
        description: "Coffee",
        date: "2026-03-28",
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      },
    });

    await render(<TransactionScreen />);

    const screenCall = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: { unstable_headerRightItems: () => { label: string; onPress: () => void }[] };
    };
    const deleteButton = screenCall.options
      .unstable_headerRightItems()
      .find((item) => item.label === "delete");

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
