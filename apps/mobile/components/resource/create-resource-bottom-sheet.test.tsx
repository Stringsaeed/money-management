import { fireEvent, render, screen } from "@testing-library/react-native";
import { View } from "react-native";

import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";

describe("CreateResourceBottomSheet", () => {
  it("exposes create-resource-submit outside ModalBottomSheet when open", async () => {
    const onSubmit = jest.fn();

    await render(
      <CreateResourceBottomSheet
        autoPresent
        content={<View testID="sheet-body" />}
        footer={
          <CreateResourceSheetFooter
            isSubmitting={false}
            onSubmit={onSubmit}
            submitLabel="Create Account"
          />
        }
        title="Add Account"
      />,
    );

    expect(screen.getByTestId("sheet-body")).toBeTruthy();
    fireEvent.press(screen.getByTestId("create-resource-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps submit hidden while the sheet is closed", async () => {
    await render(
      <CreateResourceBottomSheet
        content={<View testID="sheet-body" />}
        footer={
          <CreateResourceSheetFooter
            isSubmitting={false}
            onSubmit={jest.fn()}
            submitLabel="Create Account"
          />
        }
        title="Add Account"
      />,
    );

    expect(screen.queryByTestId("create-resource-submit")).toBeNull();
  });
});
