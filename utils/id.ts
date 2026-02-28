import { randomUUID } from "expo-crypto";

/**
 * Generate a cryptographically random UUID.
 * crypto.randomUUID() is available in React Native (Hermes) and modern browsers.
 */
export function generateId(): string {
  return randomUUID();
}
