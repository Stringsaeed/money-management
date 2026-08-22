import { fireEvent, render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AccountRow } from "@/components/settings/account-row";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

describe("AccountRow", () => {
  it("renders account details and reports press", async () => {
    const onPress = jest.fn();

    await render(
      <GestureHandlerRootView>
        <AccountRow
          account={createAccountWithBalance({ id: "account-1", name: "Wallet" })}
          onPress={onPress}
        />
      </GestureHandlerRootView>,
    );

    await fireEvent.press(screen.getByText("Wallet"));

    expect(screen.getByText(/Checking/)).toBeOnTheScreen();
    expect(screen.getByText("$250.00")).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
