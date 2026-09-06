import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { AuthBottomSheet } from "./auth-bottom-sheet";

describe("AuthBottomSheet", () => {
  it("stays closed until the trigger is pressed", async () => {
    await render(
      <AuthBottomSheet
        trigger={
          <Pressable>
            <Text>Open sheet</Text>
          </Pressable>
        }
      >
        <Text>Sheet body</Text>
      </AuthBottomSheet>,
    );

    expect(screen.queryByText("Sheet body")).toBeNull();
    await fireEvent.press(screen.getByText("Open sheet"));
    expect(screen.getByText("Sheet body")).toBeOnTheScreen();
  });

  it("renders children when the host presents it", async () => {
    await render(
      <AuthBottomSheet isPresented onDismiss={() => undefined}>
        <Text>Sheet body</Text>
      </AuthBottomSheet>,
    );

    expect(screen.getByText("Sheet body")).toBeOnTheScreen();
  });

  it("hides children when the host dismisses it", async () => {
    await render(
      <AuthBottomSheet isPresented={false} onDismiss={() => undefined}>
        <Text>Sheet body</Text>
      </AuthBottomSheet>,
    );

    expect(screen.queryByText("Sheet body")).toBeNull();
  });
});
