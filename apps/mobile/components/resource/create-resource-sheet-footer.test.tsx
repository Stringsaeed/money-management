import { fireEvent, render, screen } from "@testing-library/react-native";

import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";

describe("CreateResourceSheetFooter", () => {
  it("fires onPress from create-resource-submit", async () => {
    const onSubmit = jest.fn();

    await render(
      <CreateResourceSheetFooter
        isSubmitting={false}
        onSubmit={onSubmit}
        submitLabel="Create Account"
      />,
    );

    await fireEvent.press(screen.getByTestId("create-resource-submit"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while submitting", async () => {
    const onSubmit = jest.fn();

    await render(
      <CreateResourceSheetFooter
        isSubmitting
        onSubmit={onSubmit}
        submitLabel="Create Account"
        submittingLabel="Creating…"
      />,
    );

    expect(screen.getByTestId("create-resource-submit")).toHaveTextContent("Creating…");
    await fireEvent.press(screen.getByTestId("create-resource-submit"));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
