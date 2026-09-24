import type { ConfigContext, ExpoConfig } from "expo/config";

const workspaceFont = (relativePath: string) => `../../node_modules/${relativePath}`;
const nunitoFont = (weightDir: string, file: string) =>
  workspaceFont(`@expo-google-fonts/nunito/${weightDir}/${file}`);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Trove Next",
  slug: "trove-next",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "trove-next",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.stringsaeed.moneymanagement.next",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CADisableMinimumFrameDurationOnPhone: true,
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
    package: "com.stringsaeed.moneymanagement.next",
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
                { path: nunitoFont("200ExtraLight", "Nunito_200ExtraLight.ttf"), weight: 200 },
                { path: nunitoFont("300Light", "Nunito_300Light.ttf"), weight: 300 },
                { path: nunitoFont("400Regular", "Nunito_400Regular.ttf"), weight: 400 },
                { path: nunitoFont("500Medium", "Nunito_500Medium.ttf"), weight: 500 },
                { path: nunitoFont("600SemiBold", "Nunito_600SemiBold.ttf"), weight: 600 },
                { path: nunitoFont("700Bold", "Nunito_700Bold.ttf"), weight: 700 },
                { path: nunitoFont("800ExtraBold", "Nunito_800ExtraBold.ttf"), weight: 800 },
                { path: nunitoFont("900Black", "Nunito_900Black.ttf"), weight: 900 },
              ],
            },
          ],
        },
        ios: {
          fonts: [
            nunitoFont("200ExtraLight", "Nunito_200ExtraLight.ttf"),
            nunitoFont("300Light", "Nunito_300Light.ttf"),
            nunitoFont("400Regular", "Nunito_400Regular.ttf"),
            nunitoFont("500Medium", "Nunito_500Medium.ttf"),
            nunitoFont("600SemiBold", "Nunito_600SemiBold.ttf"),
            nunitoFont("700Bold", "Nunito_700Bold.ttf"),
            nunitoFont("800ExtraBold", "Nunito_800ExtraBold.ttf"),
            nunitoFont("900Black", "Nunito_900Black.ttf"),
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
    "./plugins/withUISceneLifecycle.js",
    "./plugins/withAndroidThemeColor.js",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
  },
  runtimeVersion: {
    policy: "appVersion",
  },
});
