import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SwipeableAccountRow } from "@/components/settings/swipeable-account-row";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  const swipeable = {
    close: jest.fn(),
    openLeft: jest.fn(),
    openRight: jest.fn(),
    reset: jest.fn(),
  };

  return {
    __esModule: true,
    default: ({ children, renderRightActions }: Record<string, unknown>) =>
      React.createElement(
        View,
        null,
        children,
        typeof renderRightActions === "function"
          ? renderRightActions({ value: 1 }, { value: -96 }, swipeable)
          : null,
      ),
  };
});

describe("SwipeableAccountRow", () => {
  it("asks for confirmation before deleting the account", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, "alert");

    render(
      <GestureHandlerRootView>
        <SwipeableAccountRow
          account={createAccountWithBalance({ id: "account-1", name: "Wallet" })}
          onDelete={onDelete}
        />
      </GestureHandlerRootView>,
    );

    fireEvent.press(screen.getByLabelText("Delete Wallet"));

    expect(alert).toHaveBeenCalledWith(
      "Delete Account?",
      "This will permanently delete Wallet and all its transactions. This cannot be undone.",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
        expect.objectContaining({ text: "Delete", style: "destructive" }),
      ]),
    );
    expect(onDelete).not.toHaveBeenCalled();

    const deleteButton = alert.mock.calls[0]?.[2]?.find((button) => button.text === "Delete");
    await act(async () => {
      await deleteButton?.onPress?.();
    });

    expect(onDelete).toHaveBeenCalledWith("account-1");
  });

  it("reports a failed deletion", async () => {
    const onDelete = jest.fn().mockRejectedValue(new Error("database unavailable"));
    const alert = jest.spyOn(Alert, "alert");

    render(
      <GestureHandlerRootView>
        <SwipeableAccountRow
          account={createAccountWithBalance({ id: "account-1", name: "Wallet" })}
          onDelete={onDelete}
        />
      </GestureHandlerRootView>,
    );

    fireEvent.press(screen.getByLabelText("Delete Wallet"));
    const deleteButton = alert.mock.calls[0]?.[2]?.find((button) => button.text === "Delete");

    await act(async () => {
      await deleteButton?.onPress?.();
    });

    expect(alert).toHaveBeenLastCalledWith(
      "Couldn't Delete Account",
      "The account was not deleted. Please try again.",
    );
  });
});
