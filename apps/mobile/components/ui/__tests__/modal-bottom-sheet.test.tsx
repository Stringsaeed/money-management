import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ModalBottomSheet } from "../modal-bottom-sheet";

describe("ModalBottomSheet", () => {
  it("does not mount the native sheet while closed", async () => {
    await render(
      <ModalBottomSheet open={false} onDismiss={() => undefined}>
        <Text>Sheet body</Text>
      </ModalBottomSheet>,
    );

    expect(screen.queryByText("Sheet body")).toBeNull();
  });

  it("mounts the native sheet while open", async () => {
    await render(
      <ModalBottomSheet open onDismiss={() => undefined}>
        <Text>Sheet body</Text>
      </ModalBottomSheet>,
    );

    expect(screen.getByText("Sheet body")).toBeOnTheScreen();
  });
});
