import type { ConfigContext, ExpoConfig } from "expo/config";

const workspaceFont = (relativePath: string) => `../../node_modules/${relativePath}`;
const nunitoFont = (weightDir: string, file: string) =>
  workspaceFont(`@expo-google-fonts/nunito/${weightDir}/${file}`);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Trove",
  slug: "money-management",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "trove-next",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.stringsaeed.moneymanagement",
    appleTeamId: "V3HN8HXZYK",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CADisableMinimumFrameDurationOnPhone: true,
      EXDevMenuShowsAtLaunch: false,
      EXDevMenuShowFloatingActionButton: false,
      EXDevMenuIsOnboardingFinished: true,
    },
    icon: "./assets/icon.icon",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.stringsaeed.moneymanagement",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 150,
        resizeMode: "contain",
        backgroundColor: "#4a8f69",
        dark: {
          backgroundColor: "#16331f",
        },
      },
    ],
    [
      "expo-font",
      {
        android: {
          fonts: [
            {
              fontFamily: "Nunito",
              fontDefinitions: [
                { path: nunitoFont("400Regular", "Nunito_400Regular.ttf"), weight: 400 },
                { path: nunitoFont("700Bold", "Nunito_700Bold.ttf"), weight: 700 },
                { path: nunitoFont("800ExtraBold", "Nunito_800ExtraBold.ttf"), weight: 800 },
              ],
            },
          ],
        },
        ios: {
          fonts: [
            nunitoFont("400Regular", "Nunito_400Regular.ttf"),
            nunitoFont("700Bold", "Nunito_700Bold.ttf"),
            nunitoFont("800ExtraBold", "Nunito_800ExtraBold.ttf"),
          ],
        },
      },
    ],
    "expo-image",
    "expo-status-bar",
    [
      "react-native-nano-icons",
      {
        iconSets: [
          {
            inputDir: "./assets/currencies",
            fontFamily: "TroveCurrencies",
            outputDir: "./assets/nanoicons",
          },
        ],
      },
    ],
    [
      // Short UI cues only: no background audio, foreground service, or file decoding.
      "react-native-audio-api",
      {
        iosBackgroundMode: false,
        androidForegroundService: false,
        androidPermissions: [],
        disableFFmpeg: true,
      },
    ],
    "./plugins/withUISceneLifecycle.js",
    "./plugins/withAndroidThemeColor.js",
    "./plugins/withDevMenuDisabled.js",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "a33b24c0-b380-4d0a-8ce6-b2f4b61da346",
    },
  },
  updates: {
    checkAutomatically: "ON_ERROR_RECOVERY",
    url: "https://u.expo.dev/a33b24c0-b380-4d0a-8ce6-b2f4b61da346",
  },
  runtimeVersion: {
    // EAS generates the ignored native directories during CNG builds, which
    // makes the experimental fingerprint policy resolve differently locally
    // and on EAS. Bump `version` for every native/public release.
    policy: "appVersion",
  },
});
