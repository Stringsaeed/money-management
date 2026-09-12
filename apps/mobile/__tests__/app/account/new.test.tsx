import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import NewAccountScreen from "@/app/account/new";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
}));

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: () => null,
}));

jest.mock("@/components/common/emoji-picker", () => ({
  EmojiPicker: () => null,
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

  it("exposes create-resource-submit outside ModalBottomSheet", async () => {
    await render(<NewAccountScreen />);

    expect(screen.getByTestId("create-resource-submit")).toHaveTextContent("Create Account");
  });

  it("creates an account and navigates back", async () => {
    await render(<NewAccountScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Wallet");
    await fireEvent.press(screen.getByTestId("create-resource-submit"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
