import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { CreateResourceFormScreen } from "@/components/resource/create-resource-form-screen";

describe("CreateResourceFormScreen", () => {
  it("keeps the footer outside KeyboardAvoidingView and forwards presses", async () => {
    const onPress = jest.fn();

    await render(
      <CreateResourceFormScreen
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            pointerEvents="auto"
            testID="footer-submit"
          >
            <Text>Submit</Text>
          </Pressable>
        }
      >
        <Text>Form body</Text>
      </CreateResourceFormScreen>,
    );

    const kav = screen.getByTestId("create-resource-form-kav");
    const scroll = screen.getByTestId("create-resource-form-scroll");
    const footer = screen.getByTestId("create-resource-form-footer");

    expect(scroll).toBeOnTheScreen();
    expect(footer).toBeOnTheScreen();
    expect(within(kav).getByTestId("create-resource-form-scroll")).toBeOnTheScreen();
    expect(within(kav).queryByTestId("create-resource-form-footer")).toBeNull();
    expect(within(footer).getByTestId("footer-submit")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("footer-submit"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
