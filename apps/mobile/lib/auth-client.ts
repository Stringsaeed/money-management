import { expoClient } from "@better-auth/expo/client";
import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

/**
 * Opt-in better-auth client backed by SecureStore. Local-only mode never
 * touches this; signing in unlocks household features.
 */
export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [
    expoClient({
      scheme: "trove",
      storagePrefix: "money-management",
      storage: SecureStore,
    }),
    magicLinkClient(),
  ],
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};
