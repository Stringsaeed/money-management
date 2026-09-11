import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@trove/api";

import { getAccessToken } from "@/lib/auth-client";

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

const link = new RPCLink({
  url: `${serverUrl}/rpc`,
  headers: async () => {
    const token = await getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const orpc: AppRouterClient = createORPCClient(link);
