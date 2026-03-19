const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow Metro to resolve .sql files for drizzle migrations
config.resolver.sourceExts.push("sql");

module.exports = withNativewind(wrapWithReanimatedMetroConfig(config));
