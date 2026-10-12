import { fireEvent, render, screen } from "@testing-library/react-native";

import { Switch } from "../../controls";
import { SettingsRow } from "../settings-row";
import { SettingsSection } from "../settings-section";
import { settingsRowLabel } from "../utils";

describe("settingsRowLabel", () => {
  it("speaks the title, then the value or that it is coming soon", () => {
    expect(settingsRowLabel({ title: "Accounts", value: "5", soon: false })).toBe("Accounts, 5");
    expect(settingsRowLabel({ title: "Appearance", soon: false })).toBe("Appearance");
    expect(settingsRowLabel({ title: "Appearance", value: "Dark", soon: true })).toBe(
      "Appearance, coming soon",
    );
  });
});

describe("SettingsSection and SettingsRow", () => {
  it("labels the group, presses a row and shows its value and footer", async () => {
    const onPress = jest.fn();
    await render(
      <SettingsSection footer="Counted from your ledger." title="Money">
        <SettingsRow chevron icon="accounts" onPress={onPress} title="Accounts" value="5" />
        <SettingsRow icon="recurring" title="Recurring" value="3" />
      </SettingsSection>,
    );
    expect(screen.getByRole("header")).toHaveTextContent("Money");
    expect(screen.getByText("Counted from your ledger.")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Accounts, 5" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("shows a Soon badge instead of the value and ignores presses", async () => {
    const onPress = jest.fn();
    await render(
      <SettingsRow chevron icon="moon" onPress={onPress} soon title="Appearance" value="Dark" />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Dark")).toBeNull();
    expect(screen.getByLabelText("Appearance, coming soon")).toBeTruthy();
  });

  it("keeps a trailing switch reachable on its own", async () => {
    const onValueChange = jest.fn();
    await render(
      <SettingsRow
        icon="volume"
        title="Sounds"
        trailing={
          <Switch accessibilityLabel="Sounds" onValueChange={onValueChange} value={false} />
        }
      />,
    );
    await fireEvent.press(screen.getByRole("switch", { name: "Sounds" }));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
