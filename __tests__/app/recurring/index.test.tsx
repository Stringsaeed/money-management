import { fireEvent, render, screen } from "@testing-library/react-native";

import RecurringListScreen from "@/app/recurring/index";
import { createRecurringPayment } from "@/tests/test-utils/factories";

const mockPush = jest.fn();
const mockUseRecurringPayments = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock("@/hooks/use-recurring-payments", () => ({
  useRecurringPayments: () => mockUseRecurringPayments(),
}));

jest.mock("@/components/recurring/recurring-payment-row", () => ({
  RecurringPaymentRow: ({
    payment,
    onPress,
  }: {
    payment: { name: string };
    onPress: () => void;
  }) => {
    const { Text, Pressable } = require("react-native");

    return (
      <Pressable onPress={onPress}>
        <Text>{payment.name}</Text>
      </Pressable>
    );
  },
}));

describe("app/recurring/index", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseRecurringPayments.mockReturnValue({ data: [], isLoading: false });
  });

  it("opens the new-recurring form from the empty state", async () => {
    await render(<RecurringListScreen />);

    fireEvent.press(screen.getByText("Add Recurring"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring/[id]",
      params: { id: "new" },
    });
  });

  it("renders rules and opens their editor", async () => {
    mockUseRecurringPayments.mockReturnValue({
      data: [createRecurringPayment({ id: "internet", name: "Internet" })],
      isLoading: false,
    });

    await render(<RecurringListScreen />);

    fireEvent.press(screen.getByText("Internet"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring/[id]",
      params: { id: "internet" },
    });
  });
});
