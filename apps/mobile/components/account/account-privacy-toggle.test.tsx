import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccountPrivacyToggle } from "./account-privacy-toggle";

describe("AccountPrivacyToggle", () => {
  it("lets the account owner make the account private", async () => {
    const onChange = jest.fn();
    await render(<AccountPrivacyToggle isPrivate={false} isPending={false} onChange={onChange} />);

    const privacySwitch = screen.getByRole("switch", { name: "Private account" });
    expect(privacySwitch).not.toBeChecked();

    await fireEvent(privacySwitch, "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
