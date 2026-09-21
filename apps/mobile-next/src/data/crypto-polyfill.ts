import { randomUUID } from "expo-crypto";

const runtimeCrypto = globalThis.crypto;

if (!runtimeCrypto?.randomUUID || !runtimeCrypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { ...(runtimeCrypto ?? {}), randomUUID },
  });
}
