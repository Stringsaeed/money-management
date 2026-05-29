import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";

import { AccountFormContent } from "@/components/account/account-form-content";
import { AccountFormSheetFooter } from "@/components/account/account-form-sheet-footer";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { accountFormOptions, type AccountFormValues } from "@/components/account/form";

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: (_props: { onChange: (value: string) => void }) => null,
}));

function AccountFormContentHarness({
  onSubmit,
}: {
  onSubmit: (values: AccountFormValues) => void;
}) {
  const [error, setError] = useState("");
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);

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
        currencyExpanded={currencyExpanded}
        form={form}
        onColorChange={(color) => {
          setHasCustomColor(true);
          form.setFieldValue("color", color);
        }}
        onCurrencyCollapse={() => setCurrencyExpanded(false)}
        onCurrencyExpandToggle={() => setCurrencyExpanded((expanded) => !expanded)}
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
  it("does not submit when the account name is blank", () => {
    const onSubmit = jest.fn();

    render(<AccountFormContentHarness onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText("Create Account"));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits account values", async () => {
    const onSubmit = jest.fn();

    render(<AccountFormContentHarness onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText("e.g. Main Checking"), "Wallet");
    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "8.50");
    fireEvent.press(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "#4A90D9",
        currency: "USD",
        name: "Wallet",
        amount: "8.50",
        type: "checking",
      }),
    );
  });
});
