import { formatCents } from "@/utils/currency";

describe("formatCents", () => {
  it("formats minor units as en-US currency strings", () => {
    expect(formatCents(1099, "USD")).toBe("$10.99");
    expect(formatCents(1099)).toBe("$10.99");
    expect(formatCents(0, "USD")).toBe("$0.00");
    expect(formatCents(-250, "USD")).toBe("-$2.50");
  });
});
