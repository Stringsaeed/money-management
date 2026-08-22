import { fireEvent, render, screen } from "@testing-library/react-native";

import { CategoryRow } from "@/components/settings/category-row";
import { createCategory } from "@/tests/test-utils/factories";

describe("CategoryRow", () => {
  it("renders category details and invokes the edit handler", async () => {
    const onPress = jest.fn();
    await render(
      <CategoryRow
        category={createCategory({ id: "category-1", name: "Groceries" })}
        onPress={onPress}
      />,
    );

    await fireEvent.press(screen.getByText("Groceries"));

    expect(onPress).toHaveBeenCalled();
  });
});
