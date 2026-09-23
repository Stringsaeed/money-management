import { createRequestKeyRunner } from "@/data/request-keys";

describe("logical mutation request keys", () => {
  it("reuses a key after an unresolved retry and rotates on payload change", async () => {
    const generated = ["key-1", "key-2"];
    const run = createRequestKeyRunner(() => generated.shift() ?? "key-fallback");
    const seen: string[] = [];

    await expect(
      run("transactions.create", "same-payload", async (key) => {
        seen.push(key);
        throw new Error("network timeout");
      }),
    ).rejects.toThrow("network timeout");

    await run("transactions.create", "same-payload", async (key) => {
      seen.push(key);
      return "replayed";
    });
    await run("transactions.create", "changed-payload", async (key) => {
      seen.push(key);
      return "new-action";
    });

    expect(seen).toEqual(["key-1", "key-1", "key-2"]);
  });
});
