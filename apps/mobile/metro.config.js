const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow Metro to resolve .sql files for drizzle migrations
config.resolver.sourceExts.push("sql");

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
