import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@trove/api";

import { authClient } from "@/lib/auth-client";

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

const link = new RPCLink({
  url: `${serverUrl}/rpc`,
  headers: () => {
    const cookie = authClient.getCookie();
    return cookie ? { cookie } : {};
  },
});

export const orpc: AppRouterClient = createORPCClient(link);
