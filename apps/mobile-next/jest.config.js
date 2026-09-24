/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@expo/ui$": "<rootDir>/src/ui/__mocks__/expo-ui.tsx",
    "^@expo/ui/community/bottom-sheet$": "<rootDir>/src/ui/__mocks__/expo-ui.tsx",
    "^@expo/ui/community/datetime-picker$": "<rootDir>/src/ui/__mocks__/expo-ui.tsx",
    "^expo-blur$": "<rootDir>/src/ui/__mocks__/expo-blur.tsx",
    "^react-native-reanimated$": "<rootDir>/src/ui/__mocks__/react-native-reanimated.ts",
    "^react-native-worklets$": "<rootDir>/src/ui/__mocks__/react-native-worklets.ts",
    "^react-native-ease$": "<rootDir>/src/ui/__mocks__/react-native-ease.tsx",
    "^react-native-nano-icons$": "<rootDir>/src/ui/__mocks__/react-native-nano-icons.tsx",
    "^react-native-linear-gradient$": "<rootDir>/src/ui/__mocks__/react-native-linear-gradient.ts",
  },
  setupFiles: ["react-native-gesture-handler/jestSetup"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|expo|expo-modules-core|@expo|@expo-google-fonts|react-navigation|@react-navigation|phosphor-react-native|@tanstack|fractional-indexing))",
  ],
};
