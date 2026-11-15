import { leftoverShareLine, planItSub, saveItSub } from "../leftovers-copy";

describe("leftoverShareLine", () => {
  it("lists each envelope's part by its emoji or name", () => {
    expect(
      leftoverShareLine(
        [
          { label: "🛒", rolloverMinor: 6_400 },
          { label: "Fuel", rolloverMinor: 4_000 },
        ],
        "AED",
      ),
    ).toBe("🛒 64 · Fuel 40");
  });
});

describe("option sentences", () => {
  const facts = { movableMinor: 16_000, totalMinor: 16_000, currency: "AED" };

  it("moves all of it, or the part not spent since", () => {
    expect(saveItSub(facts, true)).toBe("Moves all 160 into a Saving-for envelope.");
    expect(saveItSub({ ...facts, movableMinor: 12_000 }, true)).toBe(
      "Moves the 120 you haven't spent into a Saving-for envelope.",
    );
  });

  it("says why an option can't be picked", () => {
    expect(saveItSub(facts, false)).toBe("Add a Saving for envelope first.");
    expect(saveItSub({ ...facts, movableMinor: 0 }, true)).toBe(
      "You've already spent it this month.",
    );
    expect(planItSub(0)).toBe("You've already spent it this month.");
    expect(planItSub(16_000)).toBe("Gives it a new job in the next step.");
  });
});
