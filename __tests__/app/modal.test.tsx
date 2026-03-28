import { render, screen } from "@testing-library/react-native";

import ModalScreen from "@/app/modal";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe("app/modal", () => {
  it("renders the modal copy and dismiss link", () => {
    render(<ModalScreen />);

    expect(screen.getByText("This is a modal")).toBeOnTheScreen();
    expect(screen.getByText("Go to home screen")).toBeOnTheScreen();
  });
});
