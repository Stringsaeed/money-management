import { fireEvent, render, screen } from "@testing-library/react-native";

import { CtaStack } from "../cta-stack";

describe("CtaStack", () => {
  it("renders the primary pill and the quiet link", async () => {
    const onStart = jest.fn();
    const onLater = jest.fn();
    await render(
      <CtaStack
        link={{ label: "Not now", onPress: onLater }}
        primary={{ label: "Start my budget", onPress: onStart }}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Start my budget" }));
    await fireEvent.press(screen.getByRole("button", { name: "Not now" }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it("is a lone primary without a link", async () => {
    await render(<CtaStack primary={{ label: "Move AED 175", onPress: jest.fn() }} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
