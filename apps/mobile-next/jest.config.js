/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@expo/ui$": "<rootDir>/src/ui/__mocks__/expo-ui.tsx",
    "^@expo/ui/community/bottom-sheet$": "<rootDir>/src/ui/__mocks__/expo-ui.tsx",
    "^expo-blur$": "<rootDir>/src/ui/__mocks__/expo-blur.tsx",
    "^react-native-ease$": "<rootDir>/src/ui/__mocks__/react-native-ease.tsx",
    "^react-native-linear-gradient$": "<rootDir>/src/ui/__mocks__/react-native-linear-gradient.ts",
  },
  setupFiles: ["react-native-gesture-handler/jestSetup"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|expo|expo-modules-core|@expo|@expo-google-fonts|react-navigation|@react-navigation|phosphor-react-native|@tanstack|fractional-indexing))",
  ],
};
