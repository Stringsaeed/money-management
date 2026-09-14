import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import AccountPicker from "../account-picker";

describe("Transaction AccountPicker", () => {
  it("offers active Accounts and excludes archived Accounts from new activity", async () => {
    await render(
      <AccountPicker
        accounts={[
          { id: "account-active", name: "Everyday", currency: "USD", lifecycle: "active" },
          { id: "account-archived", name: "Old Wallet", currency: "USD", lifecycle: "archived" },
        ]}
        selectedId="account-active"
        onChange={jest.fn()}
      >
        <Pressable role="button">
          <Text>Choose Account</Text>
        </Pressable>
      </AccountPicker>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Choose Account" }));

    expect(screen.getByText("Everyday")).toBeOnTheScreen();
    expect(screen.queryByText("Old Wallet")).not.toBeOnTheScreen();
  });
});
