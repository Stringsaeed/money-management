// oxlint-disable anti-slop/no-module-mocking -- isolate mutation and native sheet boundaries.
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccountFormBottomSheet } from "@/components/account/account-form-sheet";
import { CategoryFormBottomSheet } from "@/components/category/category-form-sheet";
import {
  CreateResourceBottomSheet,
  type CreateResourceBottomSheetRef,
} from "@/components/resource/create-resource-bottom-sheet";

const insets = { top: 0, bottom: 0, left: 0, right: 0 };
const initialWindowMetrics = { insets, frame: { x: 0, y: 0, width: 390, height: 844 } };

const mockCreateAccount = jest.fn();
const mockCreateCategory = jest.fn();

jest.mock("@/hooks/use-accounts", () => ({
  useCreateAccount: () => ({ mutateAsync: mockCreateAccount }),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCreateCategory: () => ({ mutateAsync: mockCreateCategory }),
}));

jest.mock("@swmansion/react-native-bottom-sheet", () => {
  const React = require("react");
  const { Pressable: NativePressable, View: NativeView } = require("react-native");

  const ModalBottomSheet = ({
    children,
    index,
    onIndexChange,
  }: {
    children?: React.ReactNode;
    index: number;
    onIndexChange: (index: number) => void;
  }) =>
    React.createElement(
      NativeView,
      {
        accessibilityState: { expanded: index > 0 },
        testID: "create-resource-modal",
      },
      React.createElement(
        NativePressable,
        { onPress: () => onIndexChange(0), testID: "dismiss-create-resource-modal" },
        React.createElement(React.Fragment, null),
      ),
      children,
    );

  return {
    BottomSheetProvider: ({ children }: { children?: React.ReactNode }) => children,
    ModalBottomSheet,
  };
});

describe("create resource sheet dismissal", () => {
  beforeEach(() => {
    mockCreateAccount.mockResolvedValue("account-1");
    mockCreateCategory.mockResolvedValue("category-1");
  });

  afterEach(() => {
    mockCreateAccount.mockReset();
    mockCreateCategory.mockReset();
  });

  it("dismisses the Account sheet after a successful create", async () => {
    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AccountFormBottomSheet autoPresent />
      </SafeAreaProvider>,
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("e.g. Main Checking"),
      "Everyday account",
    );
    await fireEvent.press(screen.getByTestId("create-resource-submit"));

    await waitFor(() => expect(mockCreateAccount).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("create-resource-modal")).toBeNull());
  });

  it("dismisses the Category sheet after a successful create", async () => {
    await render(<CategoryFormBottomSheet autoPresent />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Everyday expenses");
    await fireEvent.press(screen.getByTestId("create-resource-submit"));

    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("create-resource-modal")).toBeNull());
  });

  it("calls onDismiss once when imperatively dismissed twice", async () => {
    const onDismiss = jest.fn();
    const sheetRef = React.createRef<CreateResourceBottomSheetRef>();

    await render(
      <CreateResourceBottomSheet
        autoPresent
        content={<View testID="sheet-body" />}
        footer={null}
        onDismiss={onDismiss}
        ref={sheetRef}
        title="Add Account"
      />,
    );

    await act(async () => {
      sheetRef.current?.dismiss();
      sheetRef.current?.dismiss();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("notifies once on each close after reopening", async () => {
    const onDismiss = jest.fn();

    await render(
      <CreateResourceBottomSheet
        content={<View />}
        footer={null}
        onDismiss={onDismiss}
        title="Test resource"
      >
        <Pressable testID="open-resource-sheet" />
      </CreateResourceBottomSheet>,
    );

    await fireEvent.press(screen.getByTestId("open-resource-sheet"));
    await fireEvent.press(screen.getByTestId("dismiss-create-resource-modal"));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("open-resource-sheet"));
    await fireEvent.press(screen.getByTestId("dismiss-create-resource-modal"));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
