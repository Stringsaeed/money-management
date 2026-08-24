import { describe, expect, it, vi } from "vitest";

import { createHouseholdChangePublisher, type PushNamespace } from "./publisher";

describe("createHouseholdChangePublisher", () => {
  it("is absent without the optional Durable Object binding", () => {
    expect(createHouseholdChangePublisher({})).toBeUndefined();
  });

  it("routes a committed household notification to its named Durable Object", async () => {
    const id = { toString: () => "durable-object-id" } as DurableObjectId;
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const namespace: PushNamespace = {
      idFromName: vi.fn().mockReturnValue(id),
      get: vi.fn().mockReturnValue({ fetch }),
    };
    const publishChange = createHouseholdChangePublisher({ PUSH_HOUSEHOLD_DO: namespace });

    await publishChange?.({ householdId: "household-1", seq: 7, effects: ["ledger"] });

    expect(namespace.idFromName).toHaveBeenCalledWith("household-1");
    expect(namespace.get).toHaveBeenCalledWith(id);
    expect(fetch).toHaveBeenCalledTimes(1);

    const request = fetch.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toBe("https://push.internal/publish");
    expect(await request.json()).toEqual({ seq: 7, effects: ["ledger"] });
  });
});
