import type { V2Category, V2Envelope } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../../home/home-model";
import { envelopeChips } from "../envelope-chip-model";

const envelope = (id: string, name: string, categoryIds: readonly string[]): V2Envelope => ({
  id,
  name,
  group: "everyday",
  startFresh: false,
  targetMinor: null,
  dueDate: null,
  repeat: null,
  archived: false,
  sortOrder: 0,
  categoryIds,
  version: 1,
});

const category = (id: string, icon: string): V2Category => ({
  id,
  ledgerId: "ledger",
  name: id,
  kind: "expense",
  color: "#000000",
  icon,
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
});

const line = (id: string, leftMinor: number): EnvelopeLine => ({
  envelope: envelope(id, id, [`cat-${id}`]),
  totals: {
    id,
    plannedMinor: 0,
    budgetedMinor: 0,
    spentMinor: 0,
    rolloverMinor: 0,
    leftMinor,
  },
});

const categories = [category("cat-Dining", "🍽️")];

describe("envelopeChips", () => {
  it("prints whole units left after the name, with the envelope's emoji", () => {
    expect(envelopeChips([line("Dining", 14_850)], categories, "AED")).toEqual([
      { id: "Dining", label: "Dining", emoji: "🍽️", meta: "148" },
    ]);
  });

  it("prints an envelope that is over with a minus", () => {
    expect(envelopeChips([line("Fuel", -2_000)], categories, "AED")[0]).toMatchObject({
      emoji: undefined,
      meta: "−20",
    });
  });
});
