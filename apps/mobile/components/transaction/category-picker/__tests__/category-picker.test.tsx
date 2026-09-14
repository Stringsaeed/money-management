import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import CategoryPicker from "../category-picker";

describe("Transaction CategoryPicker", () => {
  it("offers active Categories and excludes archived Categories from new activity", async () => {
    const onChange = jest.fn();
    await render(
      <CategoryPicker
        categories={[
          {
            id: "category-active",
            name: "Dining",
            icon: "🍽️",
            color: "#B48A7B",
            type: "expense",
            lifecycle: "active",
          },
          {
            id: "category-archived",
            name: "Old Dining",
            icon: "🍽️",
            color: "#B48A7B",
            type: "expense",
            lifecycle: "archived",
          },
        ]}
        selectedId={null}
        onChange={onChange}
      >
        <Pressable role="button" aria-label="Choose Category">
          <Text>Choose Category</Text>
        </Pressable>
      </CategoryPicker>,
    );

    expect(screen.getByRole("button", { name: "Dining" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Old Dining" })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Dining" }));

    expect(onChange).toHaveBeenCalledWith("category-active");
  });
});
