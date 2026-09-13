import { fireEvent, render, screen } from "@testing-library/react-native";

import { ResourceSheetDeleteButton } from "@/components/resource/resource-sheet-delete-button";

describe("ResourceSheetDeleteButton", () => {
  it("exposes the delete label and reports press", async () => {
    const onPress = jest.fn();

    await render(<ResourceSheetDeleteButton label="Delete Groceries" onPress={onPress} />);

    await fireEvent.press(screen.getByLabelText("Delete Groceries"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
