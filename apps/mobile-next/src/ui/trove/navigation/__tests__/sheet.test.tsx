import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Sheet } from "../sheet";

describe("Sheet", () => {
  it("renders its title and content while open", async () => {
    await render(
      <Sheet onDismiss={jest.fn()} open title="Move money">
        <Text>Continue</Text>
      </Sheet>,
    );
    expect(screen.getByRole("header", { name: "Move money" })).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("renders nothing until first opened", async () => {
    await render(
      <Sheet onDismiss={jest.fn()} open={false} title="Move money">
        <Text>Continue</Text>
      </Sheet>,
    );
    expect(screen.queryByText("Continue")).toBeNull();
  });
});
