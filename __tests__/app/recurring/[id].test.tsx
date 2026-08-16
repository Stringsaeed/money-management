import { act, render } from "@testing-library/react-native";

import RecurringScreen from "@/app/recurring/[id]";
import type { TransactionFormData } from "@/components/transaction/types";
import { createRecurringRule } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockMutations = {
  archive: jest.fn(),
  create: jest.fn(),
  edit: jest.fn(),
  pause: jest.fn(),
  repair: jest.fn(),
  restore: jest.fn(),
  resume: jest.fn(),
};
const mockStackScreen = jest.fn((_: unknown) => null);
const mockUseLocalSearchParams = jest.fn();
const mockUseRecurringRule = jest.fn();

let capturedFormProps: {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  statusContent?: React.ReactNode;
} | null = null;

jest.mock("expo-router", () => ({
  Stack: { Screen: (props: unknown) => mockStackScreen(props) },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockBack,
    canDismiss: () => false,
    canGoBack: () => true,
    dismiss: jest.fn(),
  }),
}));

jest.mock("@/components/transaction/transaction-form", () => ({
  TransactionForm: (props: typeof capturedFormProps) => {
    capturedFormProps = props;
    return null;
  },
}));

jest.mock("@/components/recurring/recurring-rule-status", () => ({
  RecurringRuleStatus: () => null,
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({ data: [] }),
}));

jest.mock("@/hooks/use-recurring-rules", () => ({
  useArchiveRecurringRule: () => ({ mutateAsync: mockMutations.archive }),
  useCreateRecurringRule: () => ({ mutateAsync: mockMutations.create }),
  useEditRecurringRule: () => ({ mutateAsync: mockMutations.edit }),
  usePauseRecurringRule: () => ({ mutateAsync: mockMutations.pause }),
  useRecurringRule: (...args: unknown[]) => mockUseRecurringRule(...args),
  useRepairRecurringRule: () => ({ mutateAsync: mockMutations.repair }),
  useRestoreRecurringRule: () => ({ mutateAsync: mockMutations.restore }),
  useResumeRecurringRule: () => ({ mutateAsync: mockMutations.resume }),
}));

jest.mock("@/modules/recurring-rules/clock", () => ({
  getSystemTimeZone: () => "Asia/Dubai",
}));

const formData: TransactionFormData = {
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
};

const applied = {
  kind: "applied",
  ruleId: "rule-1",
  revision: 3,
  settlement: { generatedCount: 0, totalMinor: 0 },
  effects: ["rules"],
};

describe("app/recurring/[id]", () => {
  beforeEach(() => {
    capturedFormProps = null;
    mockBack.mockClear();
    Object.values(mockMutations).forEach((mutation) => {
      mutation.mockReset();
      mutation.mockResolvedValue(applied);
    });
    mockUseLocalSearchParams.mockReturnValue({ id: "rule-1" });
  });

  it("repairs a Needs-Attention Rule through the shared transaction form", async () => {
    const rule = createRecurringRule({
      id: "rule-1",
      revision: 2,
      health: "needs_attention",
      amountMinor: null,
      accountId: null,
    });
    mockUseRecurringRule.mockReturnValue({ data: rule, isLoading: false });

    await render(<RecurringScreen />);
    await act(async () => capturedFormProps?.onSubmit(formData));

    expect(mockMutations.repair).toHaveBeenCalledWith({
      ruleId: "rule-1",
      expectedRevision: 2,
      rule: expect.objectContaining({ amountMinor: 1200_00, accountId: "account-1" }),
      confirmationToken: undefined,
    });
    expect(mockMutations.edit).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it("exposes the lifecycle action appropriate to the current Rule", async () => {
    mockUseRecurringRule.mockReturnValue({
      data: createRecurringRule({ id: "rule-1", lifecycle: "paused", revision: 4 }),
      isLoading: false,
    });

    await render(<RecurringScreen />);
    const screenOptions = mockStackScreen.mock.calls.at(-1)?.[0] as unknown as {
      options: { unstable_headerRightItems: () => { label: string; onPress: () => void }[] };
    };
    const resume = screenOptions.options
      .unstable_headerRightItems()
      .find((item) => item.label === "resume");
    await act(async () => resume?.onPress());

    expect(mockMutations.resume).toHaveBeenCalledWith({
      ruleId: "rule-1",
      expectedRevision: 4,
    });
  });
});
