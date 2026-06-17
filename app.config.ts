import type { ConfigContext, ExpoConfig } from "expo/config";

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
    slug: "trove",
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
          fonts: [
            "node_modules/@expo-google-fonts/newsreader/400Regular/Newsreader_400Regular.ttf",
            "node_modules/@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf",
          ],
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
      url: "https://u.expo.dev/a33b24c0-b380-4d0a-8ce6-b2f4b61da346",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  };
};
