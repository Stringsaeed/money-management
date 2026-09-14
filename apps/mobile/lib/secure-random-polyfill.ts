import { randomUUID } from "expo-crypto";

// TanStack DB generates mutation IDs from global crypto. Hermes does not
// provide Web Crypto, so use Expo Crypto's native UUID implementation there.
const runtimeCrypto = globalThis.crypto;
if (!runtimeCrypto?.randomUUID && !runtimeCrypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { ...(runtimeCrypto ?? {}), randomUUID },
  });
}
