import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { AmountInput } from "../../controls/amount-input";
import { SearchField } from "../../controls/search-field";
import { TextField } from "../../controls/text-field";
import { KeyboardDoneBarToolbar } from "../keyboard-done-bar-toolbar";
import { keyboardNeedsDoneBar } from "../keyboard-utils";

const withPlatform = async (os: "ios" | "android", run: () => Promise<void>) => {
  const original = Platform.OS;
  Platform.OS = os;
  try {
    await run();
  } finally {
    Platform.OS = original;
  }
};

describe("keyboardNeedsDoneBar", () => {
  it("covers keyboards without a return key only", () => {
    expect(keyboardNeedsDoneBar("decimal-pad")).toBe(true);
    expect(keyboardNeedsDoneBar("number-pad")).toBe(true);
    expect(keyboardNeedsDoneBar("email-address")).toBe(true);
    expect(keyboardNeedsDoneBar("default")).toBe(false);
    expect(keyboardNeedsDoneBar(undefined)).toBe(false);
  });
});

describe("TextField accessory wiring", () => {
  it("attaches an accessory id on iOS for number and email keyboards", async () => {
    await withPlatform("ios", async () => {
      await render(
        <TextField keyboardType="email-address" label="Email" onChangeText={jest.fn()} value="" />,
      );
      expect(screen.getByLabelText("Email").props.inputAccessoryViewID).toEqual(expect.any(String));
    });
  });

  it("leaves default keyboards and other platforms alone", async () => {
    await withPlatform("ios", async () => {
      await render(<TextField label="Name" onChangeText={jest.fn()} value="" />);
      expect(screen.getByLabelText("Name").props.inputAccessoryViewID).toBeUndefined();
    });
    await withPlatform("android", async () => {
      await render(
        <TextField keyboardType="number-pad" label="Pin" onChangeText={jest.fn()} value="" />,
      );
      expect(screen.getByLabelText("Pin").props.inputAccessoryViewID).toBeUndefined();
    });
  });

  it("honours opt-out, opt-in and a caller-supplied accessory", async () => {
    await withPlatform("ios", async () => {
      await render(
        <>
          <TextField
            keyboardAccessory={false}
            keyboardType="decimal-pad"
            label="Off"
            onChangeText={jest.fn()}
            value=""
          />
          <TextField keyboardAccessory label="On" onChangeText={jest.fn()} value="" />
          <TextField
            inputAccessoryViewID="mine"
            keyboardType="number-pad"
            label="Own"
            onChangeText={jest.fn()}
            value=""
          />
        </>,
      );
      expect(screen.getByLabelText("Off").props.inputAccessoryViewID).toBeUndefined();
      expect(screen.getByLabelText("On").props.inputAccessoryViewID).toEqual(expect.any(String));
      expect(screen.getByLabelText("Own").props.inputAccessoryViewID).toBe("mine");
    });
  });

  it("gives the amount input an accessory and the search field none by default", async () => {
    await withPlatform("ios", async () => {
      await render(
        <>
          <AmountInput currency="USD" label="Amount" onChangeText={jest.fn()} value="" />
          <SearchField onChangeText={jest.fn()} placeholder="Search" value="" />
        </>,
      );
      expect(screen.getByLabelText("Amount").props.inputAccessoryViewID).toEqual(
        expect.any(String),
      );
      expect(screen.getByLabelText("Search").props.inputAccessoryViewID).toBeUndefined();
    });
  });
});

describe("KeyboardDoneBarToolbar", () => {
  it("shows only Done when there are no field handlers", async () => {
    const onDone = jest.fn();
    await render(<KeyboardDoneBarToolbar onDone={onDone} />);
    expect(screen.queryByRole("button", { name: "Previous field" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows both arrows with one handler, disabling the other", async () => {
    const onNext = jest.fn();
    await render(<KeyboardDoneBarToolbar onDone={jest.fn()} onNext={onNext} />);
    expect(
      screen.getByRole("button", { name: "Previous field" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByRole("button", { name: "Next field" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
