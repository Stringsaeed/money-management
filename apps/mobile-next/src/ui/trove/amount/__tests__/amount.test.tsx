import { render, screen } from "@testing-library/react-native";

import { Amount } from "../amount";

describe("Amount", () => {
  it("keeps the minor-unit API unchanged", async () => {
    await render(<Amount currency="USD" minor={-6420} />);
    expect(screen.getByLabelText("minus 64.20 USD")).toBeTruthy();
    expect(screen.getByText("64")).toBeTruthy();
    expect(screen.getByText(".20")).toBeTruthy();
  });

  it("renders a decimal price of 1 or more with two decimals and no tail", async () => {
    await render(<Amount currency="USD" value="61240.18" />);
    expect(screen.getByLabelText("61,240.18 USD")).toBeTruthy();
    expect(screen.getByText("61,240")).toBeTruthy();
    expect(screen.getByText(".18")).toBeTruthy();
  });

  it("sets digits past the cent in their own faded run", async () => {
    await render(<Amount currency="USD" significant={4} value="0.00001842" />);
    expect(screen.getByLabelText("0.00001842 USD")).toBeTruthy();
    expect(screen.getByText(".00")).toBeTruthy();
    expect(screen.getByText("001842")).toBeTruthy();
  });

  it("splits 0.1834 into .18 and a 34 tail", async () => {
    await render(<Amount currency="USD" value="0.1834" />);
    expect(screen.getByText(".18")).toBeTruthy();
    expect(screen.getByText("34")).toBeTruthy();
  });

  it("renders zero as 0.00", async () => {
    await render(<Amount currency="USD" value="0" />);
    expect(screen.getByLabelText("0.00 USD")).toBeTruthy();
  });

  it("supports the receipt form with a tail", async () => {
    await render(<Amount currency="USD" isoCode value="0.1834" />);
    expect(screen.getByLabelText("0.1834 USD")).toBeTruthy();
    expect(screen.getByText("34")).toBeTruthy();
  });
});
