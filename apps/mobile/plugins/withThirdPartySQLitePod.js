const { withPodfileProperties } = require("@expo/config-plugins");

module.exports = (config) =>
  withPodfileProperties(config, (mod) => {
    mod.modResults["expo.updates.useThirdPartySQLitePod"] = "true";
    return mod;
  });
