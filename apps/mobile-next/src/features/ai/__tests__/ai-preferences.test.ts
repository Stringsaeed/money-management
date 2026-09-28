import {
  DEFAULT_AI_PREFERENCES,
  parseAiPreferences,
  serializeAiPreferences,
} from "../ai-preferences";

describe("AI preferences", () => {
  it("turns smart categories on until the person opts out", () => {
    expect(parseAiPreferences(null)).toEqual({ autoCategorize: true });
  });

  it("round-trips a saved opt-out", () => {
    const stored = serializeAiPreferences({ autoCategorize: false });
    expect(parseAiPreferences(stored)).toEqual({ autoCategorize: false });
  });

  it("falls back to the defaults for unreadable storage", () => {
    expect(parseAiPreferences("{")).toBe(DEFAULT_AI_PREFERENCES);
    expect(parseAiPreferences('{"autoCategorize":"no"}')).toBe(DEFAULT_AI_PREFERENCES);
  });
});
