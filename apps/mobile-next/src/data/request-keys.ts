import { randomUUID } from "expo-crypto";

export interface RequestKeyRunner {
  <T>(
    operation: string,
    fingerprint: string,
    action: (requestKey: string) => Promise<T>,
  ): Promise<T>;
}

/** Keeps one bounded retry key per logical mutation operation. */
export function createRequestKeyRunner(createKey: () => string = randomUUID): RequestKeyRunner {
  const entries = new Map<string, { readonly fingerprint: string; readonly requestKey: string }>();

  return async function runWithRequestKey<T>(
    operation: string,
    fingerprint: string,
    action: (requestKey: string) => Promise<T>,
  ): Promise<T> {
    const previous = entries.get(operation);
    const requestKey =
      previous && previous.fingerprint === fingerprint ? previous.requestKey : createKey();
    entries.set(operation, { fingerprint, requestKey });
    try {
      const result = await action(requestKey);
      entries.delete(operation);
      return result;
    } catch (error) {
      // Preserve the key when the response is uncertain so a user retry is idempotent.
      throw error;
    }
  };
}
