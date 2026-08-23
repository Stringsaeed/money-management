import { expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import { SetupAssignmentInput } from "./setup-assignment-input";

it("preserves invalid text across committed amount changes until the user resolves it", async () => {
  const onChange = jest.fn();
  const view = await render(
    <SetupAssignmentInput amountMinor={100} envelopeName="Travel" onChange={onChange} />,
  );
  const input = view.getByLabelText("Travel initial Assignment");

  await fireEvent.changeText(input, "-1.001");
  await fireEvent(input, "endEditing", { nativeEvent: { text: "-1.001" } });
  await view.rerender(
    <SetupAssignmentInput amountMinor={300} envelopeName="Travel" onChange={onChange} />,
  );

  expect(view.getByDisplayValue("-1.001")).toBeOnTheScreen();
  await fireEvent.changeText(input, "3.00");
  await fireEvent(input, "endEditing", { nativeEvent: { text: "3.00" } });
  expect(onChange).toHaveBeenLastCalledWith(300);
});
