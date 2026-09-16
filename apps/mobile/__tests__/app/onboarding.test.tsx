import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import OnboardingScreen from "@/app/onboarding";

const mockReplace = jest.fn();
const mockMutateAsync = jest.fn();
const mockCreateElement = createElement;
const mockText = Text;

const TEST_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const TEST_FRAME = { x: 0, y: 0, width: 375, height: 812 };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={{ insets: TEST_INSETS, frame: TEST_FRAME }}>
      {children}
    </SafeAreaProvider>
  );
}

jest.mock("expo-router", () => ({
  router: {
    replace: (href: string) => mockReplace(href),
  },
  Redirect: ({ href }: { href: string }) => {
    return mockCreateElement(mockText, null, `redirect:${href}`);
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useCreateAccount: () => ({ mutateAsync: mockMutateAsync }),
  useUpdateAccount: () => ({ mutateAsync: jest.fn() }),
}));

/** Walks the flow from the welcome screen up to the given step. */
async function advanceTo(step: "name" | "balance" | "style") {
  await fireEvent.press(screen.getByTestId("onboarding-start"));
  if (step === "name") return;

  await fireEvent.changeText(screen.getByTestId("onboarding-name-input"), "Main Checking");
  await fireEvent.press(screen.getByTestId("onboarding-continue"));
  if (step === "balance") return;

  await fireEvent.press(screen.getByTestId("onboarding-continue"));
}

describe("app/onboarding", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue("account-id");
  });

  it("opens on the welcome screen", async () => {
    await render(<OnboardingFlow />, { wrapper: Wrapper });

    expect(screen.getByText("Trove")).toBeOnTheScreen();
    expect(screen.getByTestId("onboarding-start")).toBeOnTheScreen();
  });

  it("blocks the first step until the account has a name", async () => {
    await render(<OnboardingFlow />, { wrapper: Wrapper });
    await advanceTo("name");

    expect(screen.getByTestId("onboarding-continue")).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId("onboarding-name-input"), "Main Checking");

    expect(screen.getByTestId("onboarding-continue")).not.toBeDisabled();
  });

  it("rejects a starting balance with too many decimals", async () => {
    await render(<OnboardingFlow />, { wrapper: Wrapper });
    await advanceTo("balance");

    await fireEvent.changeText(screen.getByTestId("onboarding-amount-input"), "12.345");

    expect(screen.getByTestId("onboarding-continue")).toBeDisabled();
  });

  it("steps back to the previous step", async () => {
    await render(<OnboardingFlow />, { wrapper: Wrapper });
    await advanceTo("balance");

    expect(screen.getByText("What's in it today?")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("onboarding-back"));

    expect(screen.getByText("Name your first plot")).toBeOnTheScreen();
  });

  it("creates the account and hands off to the app", async () => {
    await render(<OnboardingFlow />, { wrapper: Wrapper });
    await advanceTo("balance");

    await fireEvent.changeText(screen.getByTestId("onboarding-amount-input"), "12.34");
    await fireEvent.press(screen.getByTestId("onboarding-continue"));

    expect(screen.getByText("Make it yours")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("onboarding-continue"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: "USD",
          initialBalance: 1234,
          name: "Main Checking",
          type: "checking",
        }),
      );
    });

    const finish = await screen.findByTestId("onboarding-finish");
    expect(screen.getByText("Your garden is planted")).toBeOnTheScreen();

    await fireEvent.press(finish);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("surfaces a message when account creation fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("boom"));

    await render(<OnboardingFlow />, { wrapper: Wrapper });
    await advanceTo("style");

    await fireEvent.press(screen.getByTestId("onboarding-continue"));

    expect(
      await screen.findByText("Could not create the account. Please try again."),
    ).toBeOnTheScreen();
  });

  it("redirects direct navigation while onboarding is disabled", async () => {
    await render(<OnboardingScreen />, { wrapper: Wrapper });

    expect(screen.getByText("redirect:/")).toBeOnTheScreen();
  });
});
