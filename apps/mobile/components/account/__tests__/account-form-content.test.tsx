import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccountFormContent } from "@/components/account/account-form-content";
import { AccountFormSheetFooter } from "@/components/account/account-form-sheet-footer";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { accountFormOptions, type AccountFormValues } from "@/components/account/form";

const insets = { top: 0, bottom: 0, left: 0, right: 0 };
const initialWindowMetrics = { insets, frame: { x: 0, y: 0, width: 390, height: 844 } };

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: (_props: { onChange: (value: string) => void }) => null,
}));

function AccountFormContentHarness({
  amountEditable = true,
  lockedBalanceCents,
  onSubmit,
}: {
  amountEditable?: boolean;
  lockedBalanceCents?: number;
  onSubmit: (values: AccountFormValues) => void;
}) {
  const [error, setError] = useState("");
  const [hasCustomColor, setHasCustomColor] = useState(false);

  const form = useForm({
    ...accountFormOptions,
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        return;
      }

      try {
        onSubmit(value);
      } catch {
        setError("Couldn't create account. Try again.");
      }
    },
  });

  return (
    <>
      <AccountFormContent
        amountEditable={amountEditable}
        form={form}
        lockedBalanceCents={lockedBalanceCents}
        onColorChange={(color) => {
          setHasCustomColor(true);
          form.setFieldValue("color", color);
        }}
        onIconChange={(icon) => {
          form.setFieldValue("icon", icon);
        }}
        onTypeChange={(type) => {
          form.setFieldValue("type", type);
          if (!hasCustomColor) {
            form.setFieldValue("color", ACCOUNT_TYPE_META[type].color);
          }
        }}
      />
      <AccountFormSheetFooter error={error} form={form} onSubmit={() => form.handleSubmit()} />
    </>
  );
}

describe("AccountFormContent", () => {
  it("does not submit when the account name is blank", async () => {
    const onSubmit = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AccountFormContentHarness onSubmit={onSubmit} />
      </SafeAreaProvider>,
    );

    await fireEvent.press(screen.getByText("Create Account"));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits account values", async () => {
    const onSubmit = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AccountFormContentHarness onSubmit={onSubmit} />
      </SafeAreaProvider>,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Wallet");
    await fireEvent.changeText(screen.getByPlaceholderText("0.00"), "8.50");
    await fireEvent.press(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "#4A90D9",
        currency: "USD",
        icon: "💳",
        name: "Wallet",
        amount: "8.50",
        type: "checking",
      }),
    );
  });

  it("hides the starting amount field when editing", async () => {
    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AccountFormContentHarness
          amountEditable={false}
          lockedBalanceCents={250_00}
          onSubmit={jest.fn()}
        />
      </SafeAreaProvider>,
    );

    expect(screen.queryByPlaceholderText("0.00")).not.toBeOnTheScreen();
    expect(screen.getAllByText("$250.00").length).toBeGreaterThan(0);
    expect(screen.getByText(/Balance updates through transactions/)).toBeOnTheScreen();
  });
});
