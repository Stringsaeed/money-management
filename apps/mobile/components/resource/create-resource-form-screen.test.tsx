import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { CreateResourceFormScreen } from "@/components/resource/create-resource-form-screen";

describe("CreateResourceFormScreen", () => {
  it("keeps the footer inside the form ScrollView and forwards presses", async () => {
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

    const scroll = screen.getByTestId("create-resource-form-scroll");
    const footer = screen.getByTestId("create-resource-form-footer");

    expect(scroll).toBeOnTheScreen();
    expect(footer).toBeOnTheScreen();
    expect(within(scroll).getByTestId("create-resource-form-footer")).toBeOnTheScreen();
    expect(within(footer).getByTestId("footer-submit")).toBeOnTheScreen();
    expect(screen.queryByTestId("create-resource-form-kav")).toBeNull();

    fireEvent.press(screen.getByTestId("footer-submit"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
