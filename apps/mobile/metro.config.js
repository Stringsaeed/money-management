const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: {
      blockList: {
        [require.resolve("@powersync/react-native")]: true,
      },
    },
  },
});

// Allow Metro to resolve .sql files for drizzle migrations
config.resolver.sourceExts.push("sql");

// react-native-screens may drop a .rnrepo-cache tree that Metro/Watchman
// tries to hash, crashing the bundler mid-cert. Keep it out of the graph.
config.resolver.blockList = [/(.*\/)?\.rnrepo-cache\/.*/];

const opSqliteRoot = path.dirname(require.resolve("@op-engineering/op-sqlite/package.json"));
const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@op-engineering/op-sqlite") {
    const entry =
      platform === "web"
        ? path.join(opSqliteRoot, "lib/module/index.web.js")
        : path.join(opSqliteRoot, "lib/module/index.js");
    return { filePath: entry, type: "sourceFile" };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativewind(config);
