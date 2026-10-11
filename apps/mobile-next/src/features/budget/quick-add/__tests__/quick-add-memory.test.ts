import {
  EMPTY_QUICK_ADD_MEMORY,
  parseQuickAddMemory,
  rememberSpend,
  serializeQuickAddMemory,
} from "../quick-add-memory";

describe("rememberSpend", () => {
  it("moves a reused envelope to the front without duplicating it", () => {
    const first = rememberSpend(EMPTY_QUICK_ADD_MEMORY, { accountId: "bank", envelopeId: "a" });
    const second = rememberSpend(first, { accountId: "card", envelopeId: "b" });
    const third = rememberSpend(second, { accountId: "card", envelopeId: "a" });
    expect(third).toEqual({ lastAccountId: "card", recentEnvelopeIds: ["a", "b"] });
  });

  it("keeps only the eight most recent envelopes", () => {
    const ids = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const memory = ids.reduce(
      (current, envelopeId) => rememberSpend(current, { accountId: "bank", envelopeId }),
      EMPTY_QUICK_ADD_MEMORY,
    );
    expect(memory.recentEnvelopeIds).toEqual(["9", "8", "7", "6", "5", "4", "3", "2"]);
  });
});

describe("parseQuickAddMemory", () => {
  it("round-trips a saved memory", () => {
    const saved = { lastAccountId: "card", recentEnvelopeIds: ["a", "b"] };
    expect(parseQuickAddMemory(serializeQuickAddMemory(saved))).toEqual(saved);
  });

  it("starts empty for missing or damaged storage", () => {
    expect(parseQuickAddMemory(null)).toEqual(EMPTY_QUICK_ADD_MEMORY);
    expect(parseQuickAddMemory("not json")).toEqual(EMPTY_QUICK_ADD_MEMORY);
    expect(parseQuickAddMemory('{"lastAccountId":4,"recentEnvelopeIds":["a",2]}')).toEqual({
      lastAccountId: null,
      recentEnvelopeIds: [],
    });
  });
});
