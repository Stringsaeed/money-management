import { describe, expect, it, vi } from "vitest";

import type { CommandDatabase } from "../commands/types";
import type { PushNamespace } from "./publisher";
import { handleHouseholdPushUpgrade } from "./upgrade";

const request = new Request("https://api.test/api/push/household/household-1", {
  headers: { cookie: "session=fake" },
});

const membershipDb = (rows: readonly { id: string }[]): CommandDatabase => {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { select } as unknown as CommandDatabase;
};

describe("handleHouseholdPushUpgrade", () => {
  it("rejects an unauthenticated subscription before reading membership", async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    const response = await handleHouseholdPushUpgrade(
      { getSession, db: membershipDb([]), namespace: undefined },
      request,
      "household-1",
    );

    expect(response.status).toBe(401);
    expect(getSession).toHaveBeenCalledWith({ headers: request.headers });
  });

  it("rejects a non-member before forwarding to the household object", async () => {
    const id = { toString: () => "do-id" } as DurableObjectId;
    const forward = vi.fn();
    const namespace: PushNamespace = {
      idFromName: vi.fn().mockReturnValue(id),
      get: vi.fn().mockReturnValue({ fetch: forward }),
    };
    const response = await handleHouseholdPushUpgrade(
      {
        getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
        db: membershipDb([]),
        namespace,
      },
      request,
      "household-1",
    );

    expect(response.status).toBe(403);
    expect(forward).not.toHaveBeenCalled();
  });

  it("returns unavailable after membership succeeds when push is not bound", async () => {
    const response = await handleHouseholdPushUpgrade(
      {
        getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
        db: membershipDb([{ id: "membership-1" }]),
        namespace: undefined,
      },
      request,
      "household-1",
    );

    expect(response.status).toBe(503);
  });

  it("forwards an authorized member to exactly their household object", async () => {
    const id = { toString: () => "do-id" } as DurableObjectId;
    const forwarded = new Response(null, { status: 204 });
    const fetch = vi.fn().mockResolvedValue(forwarded);
    const namespace: PushNamespace = {
      idFromName: vi.fn().mockReturnValue(id),
      get: vi.fn().mockReturnValue({ fetch }),
    };
    const response = await handleHouseholdPushUpgrade(
      {
        getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
        db: membershipDb([{ id: "membership-1" }]),
        namespace,
      },
      request,
      "household-1",
    );

    expect(namespace.idFromName).toHaveBeenCalledWith("household-1");
    expect(namespace.get).toHaveBeenCalledWith(id);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(forwarded);
  });
});
