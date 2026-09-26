import {
  DEFAULT_SOUND_PREFERENCES,
  parseSoundPreferences,
  serializeSoundPreferences,
} from "../sound-preferences";

describe("parseSoundPreferences", () => {
  it("falls back to defaults when nothing is stored", () => {
    expect(parseSoundPreferences(null)).toEqual(DEFAULT_SOUND_PREFERENCES);
  });

  it("falls back to defaults for malformed or mistyped data", () => {
    expect(parseSoundPreferences("{not json")).toEqual(DEFAULT_SOUND_PREFERENCES);
    expect(parseSoundPreferences('{"enabled":"yes","volume":1}')).toEqual(
      DEFAULT_SOUND_PREFERENCES,
    );
  });

  it("round-trips saved preferences and clamps volume to 0-1", () => {
    const saved = { enabled: false, volume: 0.35 };
    expect(parseSoundPreferences(serializeSoundPreferences(saved))).toEqual(saved);
    expect(parseSoundPreferences('{"enabled":true,"volume":4}')).toEqual({
      enabled: true,
      volume: 1,
    });
  });
});
