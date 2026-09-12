import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { CreateResourceFormScreen } from "@/components/resource/create-resource-form-screen";

describe("CreateResourceFormScreen", () => {
  it("forwards presses to the footer slot above the scroll area", async () => {
    const onPress = jest.fn();

    await render(
      <CreateResourceFormScreen
        footer={
          <Pressable accessibilityRole="button" onPress={onPress} testID="footer-submit">
            <Text>Submit</Text>
          </Pressable>
        }
      >
        <Text>Form body</Text>
      </CreateResourceFormScreen>,
    );

    expect(screen.getByTestId("create-resource-form-scroll")).toBeOnTheScreen();
    expect(screen.getByTestId("create-resource-form-footer")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("footer-submit"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
