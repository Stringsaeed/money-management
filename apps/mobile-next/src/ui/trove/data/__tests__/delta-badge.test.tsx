import { render, screen } from "@testing-library/react-native";

import { Amount } from "../../amount";
import { DeltaBadge } from "../delta-badge";

describe("DeltaBadge", () => {
  it("reads up for a positive percent", async () => {
    await render(<DeltaBadge percent={2.6} />);
    expect(screen.getByText("+2.6%")).toBeTruthy();
    expect(screen.getByLabelText("up 2.6 percent")).toBeTruthy();
  });

  it("reads down for a negative percent", async () => {
    await render(<DeltaBadge percent={-1.1} />);
    expect(screen.getByText("−1.1%")).toBeTruthy();
    expect(screen.getByLabelText("down 1.1 percent")).toBeTruthy();
  });

  it("is neutral at zero", async () => {
    await render(<DeltaBadge percent={0} />);
    expect(screen.getByLabelText("no change, 0.0 percent")).toBeTruthy();
  });

  it("shows an explicit warning label as given", async () => {
    await render(<DeltaBadge label="94% used" tone="warning" />);
    expect(screen.getByText("94% used")).toBeTruthy();
    expect(screen.getByLabelText("94% used")).toBeTruthy();
  });

  it("lets the caller override the tone derived from percent", async () => {
    await render(<DeltaBadge percent={12} tone="warning" />);
    expect(screen.getByText("+12.0%")).toBeTruthy();
  });

  it("renders custom content such as an amount", async () => {
    await render(
      <DeltaBadge tone="positive">
        <Amount currency="USD" minor={32014} signDisplay="always" size="sm" tone="positive" />
      </DeltaBadge>,
    );
    expect(screen.getByLabelText(/plus .*320\.14/)).toBeTruthy();
  });
});
