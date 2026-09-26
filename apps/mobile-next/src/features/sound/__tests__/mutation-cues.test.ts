import { playedSounds } from "../__mocks__/cuelume-native";
import { mutationSuccessCue, withMutationCues } from "../mutation-cues";

beforeEach(() => {
  playedSounds.length = 0;
});

describe("mutationSuccessCue", () => {
  it("uses a softer cue for removals and a toggle for lifecycle changes", () => {
    expect(mutationSuccessCue("createTransaction")).toBe("success");
    expect(mutationSuccessCue("deleteTransaction")).toBe("remove");
    expect(mutationSuccessCue("archiveAccount")).toBe("remove");
    expect(mutationSuccessCue("changeRecurringLifecycle")).toBe("toggle");
  });
});

describe("withMutationCues", () => {
  it("plays the success sound and returns the mutation result", async () => {
    const mutations = withMutationCues({
      createAccount: async (name: string) => ({ id: `id-${name}` }),
    });
    await expect(mutations.createAccount("cash")).resolves.toEqual({ id: "id-cash" });
    expect(playedSounds).toEqual(["success"]);
  });

  it("plays the error sound and rethrows when a mutation fails", async () => {
    const failure = new Error("offline");
    const mutations = withMutationCues({
      deleteCategory: async () => {
        throw failure;
      },
    });
    await expect(mutations.deleteCategory()).rejects.toBe(failure);
    expect(playedSounds).toEqual(["error"]);
  });
});
