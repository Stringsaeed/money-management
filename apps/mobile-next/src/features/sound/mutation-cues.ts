import { playCue, type SoundCue } from "./sound-cues";

/** Maps a ledger mutation name to the cue played when it succeeds. */
export function mutationSuccessCue(name: string): SoundCue {
  if (name.startsWith("delete") || name.startsWith("archive")) return "remove";
  if (name === "changeRecurringLifecycle") return "toggle";
  return "success";
}

/** Ledger mutations resolve with the saved record, or nothing for removals. */
type Mutation = (...args: never[]) => Promise<object | void>;

const withCue =
  <Args extends never[], Result>(name: string, mutate: (...args: Args) => Promise<Result>) =>
  async (...args: Args): Promise<Result> => {
    try {
      const result = await mutate(...args);
      playCue(mutationSuccessCue(name));
      return result;
    } catch (cause) {
      playCue("error");
      throw cause;
    }
  };

/** Wraps each mutation so it plays its success cue on resolve and the error cue on reject. */
export function withMutationCues<T extends Record<string, Mutation>>(mutations: T): T {
  const wrapped = Object.fromEntries(
    Object.entries(mutations).map(([name, mutate]) => [name, withCue(name, mutate)]),
  );
  // SAFETY: every key is preserved and each function keeps its arguments and resolved value;
  // the wrapper only adds sound side effects around the original call.
  return wrapped as T;
}
