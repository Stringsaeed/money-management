const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

const FLAGS = {
  EXDevMenuShowsAtLaunch: "false",
  EXDevMenuShowFloatingActionButton: "false",
  EXDevMenuIsOnboardingFinished: "true",
};

function withDevMenuDisabled(config) {
  return withAndroidManifest(config, (next) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(next.modResults);
    for (const [name, value] of Object.entries(FLAGS)) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, name, value);
    }
    return next;
  });
}

module.exports = withDevMenuDisabled;
