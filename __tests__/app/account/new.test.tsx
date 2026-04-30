import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import NewAccountScreen from "@/app/account/new";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: (_props: { onChange: (value: string) => void }) => null,
}));

jest.mock("@/hooks/use-accounts", () => ({
  useCreateAccount: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
  }),
}));

describe("app/account/new", () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it("validates the account name", async () => {
    render(<NewAccountScreen />);

    fireEvent.press(screen.getByText("Create Account"));

    expect(
      await screen.findByText("Add an account name so it can show up clearly across your ledger."),
    ).toBeOnTheScreen();
  });

  it("creates an account and navigates back", async () => {
    render(<NewAccountScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Wallet");
    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "8.50");
    fireEvent.press(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
