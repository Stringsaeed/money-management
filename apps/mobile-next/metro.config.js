const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// cuelume-native@0.1.0 exposes TS sources under the "react-native" condition, but those
// sources import sibling files with ".js" suffixes that only exist in the compiled dist.
// Skip that condition for this package so its "import" entry (dist) is used instead.
const resolveRequest =
  config.resolver.resolveRequest ??
  ((context, ...args) => context.resolveRequest(context, ...args));
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName !== "cuelume-native") return resolveRequest(context, moduleName, platform);
  const withoutSourceCondition = (names) => names.filter((name) => name !== "react-native");
  return resolveRequest(
    {
      ...context,
      unstable_conditionNames: withoutSourceCondition(context.unstable_conditionNames),
      unstable_conditionsByPlatform: Object.fromEntries(
        Object.entries(context.unstable_conditionsByPlatform).map(([key, names]) => [
          key,
          withoutSourceCondition(names),
        ]),
      ),
    },
    moduleName,
    platform,
  );
};

module.exports = config;
