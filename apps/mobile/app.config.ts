import type { ConfigContext, ExpoConfig } from "expo/config";

const isOtaUpdateMandatory = process.env.EXPO_PUBLIC_OTA_UPDATE_MANDATORY === "true";

// Dependencies are hoisted to the workspace root node_modules by pnpm
// (nodeLinker: hoisted), so font assets resolve relative to apps/mobile.
const workspaceFont = (relativePath: string) => `../../node_modules/${relativePath}`;
const nunitoFont = (weightDir: string, file: string) =>
  workspaceFont(`@expo-google-fonts/nunito/${weightDir}/${file}`);

const getAppName = () => {
  switch (process.env.APP_ENV) {
    case "production":
      return "Trove";
    case "preview":
      return "Trove (Preview)";
    default:
      return "Trove (Dev)";
  }
};

const getAppId = () => {
  // switch (process.env.EAS_BUILD_PROFILE) {
  //   case "production":
  //     return "com.stringsaeed.moneymanagement";
  //   case "preview":
  //     return "com.stringsaeed.moneymanagement.preview";
  //   default:
  return "com.stringsaeed.moneymanagement";
  // }
};

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: getAppName(),
    slug: "money-management",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "trove",
    userInterfaceStyle: "automatic",
    buildCacheProvider: "eas",
    ios: {
      supportsTablet: true,
      bundleIdentifier: getAppId(),
      appleTeamId: "V3HN8HXZYK",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
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
      package: getAppId(),
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
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
                  {
                    path: nunitoFont("200ExtraLight", "Nunito_200ExtraLight.ttf"),
                    weight: 200,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("700Bold", "Nunito_700Bold.ttf"),
                    weight: 700,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("300Light", "Nunito_300Light.ttf"),
                    weight: 300,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("400Regular", "Nunito_400Regular.ttf"),
                    weight: 400,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("500Medium", "Nunito_500Medium.ttf"),
                    weight: 500,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("600SemiBold", "Nunito_600SemiBold.ttf"),
                    weight: 600,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("800ExtraBold", "Nunito_800ExtraBold.ttf"),
                    weight: 800,
                    style: "normal",
                  },
                  {
                    path: nunitoFont("900Black", "Nunito_900Black.ttf"),
                    weight: 900,
                    style: "normal",
                  },
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
      "expo-web-browser",
      "expo-sqlite",
      "expo-status-bar",
      "@react-native-community/datetimepicker",
      "expo-build-properties",
      "@rnrepo/expo-config-plugin",
      "./plugins/withRocketSimConnect.js",
      "react-native-nitro-fetch",
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
      ota: {
        mandatory: isOtaUpdateMandatory,
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
  };
};
