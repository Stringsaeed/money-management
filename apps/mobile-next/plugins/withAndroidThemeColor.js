/**
 * Expo Config Plugin: withAndroidThemeColor
 *
 * Writes the Trove design tokens into Android color resources during prebuild, using Expo's
 * stock color mods: day values to values/colors.xml and night values to
 * values-night/colors.xml. src/ui/trove/tokens/colors.ts reads them back through
 * PlatformColor("@color/trove_*"), so light/dark resolves natively.
 *
 * The token values live in src/ui/trove/tokens/colors.json — the single source shared with
 * colors.ts. Adding a token requires a prebuild before the next Android build.
 */

const {
  withAndroidColors,
  withAndroidColorsNight,
  AndroidConfig,
} = require("@expo/config-plugins");

const troveColorValues = require("../src/ui/trove/tokens/colors.json");

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** CSS `#RRGGBBAA` → Android `#AARRGGBB`; `#RRGGBB` passes through. */
function toAndroidHex(value) {
  const hex = value.toUpperCase();
  return hex.length === 9 ? `#${hex.slice(7)}${hex.slice(1, 7)}` : hex;
}

function withTroveColors(config, colors) {
  for (const [key, value] of Object.entries(colors)) {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: `trove_${camelToSnake(key)}`,
      value: toAndroidHex(value),
    });
  }
  return config;
}

const withAndroidThemeColor = (config) => {
  config = withAndroidColors(config, (config) => withTroveColors(config, troveColorValues.light));
  config = withAndroidColorsNight(config, (config) =>
    withTroveColors(config, troveColorValues.dark),
  );
  return config;
};

module.exports = withAndroidThemeColor;
