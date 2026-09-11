import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_WORKOS_CLIENT_ID: z.string().min(1),
    EXPO_PUBLIC_WORKOS_REDIRECT_URI: z.string().min(1).default("trove://callback"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
