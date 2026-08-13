import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import OnboardingScreen from "@/app/onboarding";

const mockRouter = {
  replace: jest.fn(),
};
const values = jest.fn();
const mockInsert = jest.fn(() => ({ values }));

jest.mock("expo-router", () => ({
  router: {
    replace: (href: string) => mockRouter.replace(href),
  },
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock("drizzle-orm/expo-sqlite", () => ({
  drizzle: () => ({
    insert: mockInsert,
  }),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("app/onboarding", () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    values.mockResolvedValue(undefined);
  });

  it("shows validation when the account name is missing", async () => {
    await render(<OnboardingScreen />);

    await fireEvent.press(screen.getByText("Create Account"));

    expect(await screen.findByText("Account name is required")).toBeOnTheScreen();
  });

  it("creates the first account and redirects home", async () => {
    await render(<OnboardingScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Main Checking");
    await fireEvent.changeText(screen.getByPlaceholderText("0.00"), "12.34");
    await fireEvent.press(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(values).toHaveBeenCalled();
    });

    await values.mock.results[0]?.value;

    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("shows a failure message when account creation fails", async () => {
    values.mockRejectedValueOnce(new Error("boom"));

    await render(<OnboardingScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Main Checking");
    await fireEvent.press(screen.getByText("Create Account"));

    expect(
      await screen.findByText("Failed to create account. Please try again."),
    ).toBeOnTheScreen();
  });
});
