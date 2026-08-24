import { describe, expect, it } from "vitest";

import { householdChannel } from "@trove/protocol";

import { HouseholdPushDO } from "./household-push-do";

interface FakeSocket {
  readyState: number;
  sent: string[];
  send(message: string): void;
}

function fakeSocket(readyState: number = WebSocket.OPEN): FakeSocket {
  return {
    readyState,
    sent: [],
    send(message: string) {
      this.sent.push(message);
    },
  };
}

function fakeState(name: string, sockets: WebSocket[]) {
  return {
    id: { name, toString: () => `do-id-${name}` },
    acceptWebSocket: (_socket: WebSocket) => undefined,
    getWebSockets: () => sockets,
  } as unknown as DurableObjectState;
}

function publishRequest(body: unknown): Request {
  return new Request("https://push.internal/publish", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("HouseholdPushDO", () => {
  it("broadcasts {channel, seq, effects} — never row data — to open sockets", async () => {
    const socket = fakeSocket();
    const state = fakeState("household-1", [socket as unknown as WebSocket]);
    const instance = new HouseholdPushDO(state);

    const response = await instance.fetch(
      publishRequest({ seq: 7, effects: ["ledger", "balances"] }),
    );

    expect(response.status).toBe(204);
    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0])).toEqual({
      channel: householdChannel("household-1"),
      seq: 7,
      effects: ["ledger", "balances"],
    });
  });

  it("keeps households isolated: a publish reaches only that household's object", async () => {
    const socketA = fakeSocket();
    const socketB = fakeSocket();
    const doA = new HouseholdPushDO(fakeState("household-a", [socketA as unknown as WebSocket]));
    const doB = new HouseholdPushDO(fakeState("household-b", [socketB as unknown as WebSocket]));

    await doA.fetch(publishRequest({ seq: 3, effects: ["members"] }));
    // B's object publishes nothing on its own channel.
    void doB;

    expect(JSON.parse(socketA.sent[0]).channel).toBe(householdChannel("household-a"));
    expect(socketB.sent).toEqual([]);
  });

  it("skips closed sockets instead of throwing", async () => {
    const closed = fakeSocket(WebSocket.CLOSING);
    const open = fakeSocket();
    const instance = new HouseholdPushDO(
      fakeState("household-1", [closed as unknown as WebSocket, open as unknown as WebSocket]),
    );

    const response = await instance.fetch(publishRequest({ seq: 1, effects: [] }));

    expect(response.status).toBe(204);
    expect(closed.sent).toEqual([]);
    expect(open.sent).toHaveLength(1);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["missing seq", JSON.stringify({ effects: ["ledger"] })],
    ["non-integer seq", JSON.stringify({ seq: 1.5, effects: [] })],
    ["non-array effects", JSON.stringify({ seq: 2, effects: "ledger" })],
  ])("rejects %s with 400 and broadcasts nothing", async (_label, body) => {
    const socket = fakeSocket();
    const instance = new HouseholdPushDO(
      fakeState("household-1", [socket as unknown as WebSocket]),
    );

    const response = await instance.fetch(publishRequest(body));

    expect(response.status).toBe(400);
    expect(socket.sent).toEqual([]);
  });

  it("drops unknown effect tags so old consumers tolerate newer vocabularies", async () => {
    const socket = fakeSocket();
    const instance = new HouseholdPushDO(
      fakeState("household-1", [socket as unknown as WebSocket]),
    );

    await instance.fetch(publishRequest({ seq: 4, effects: ["ledger", "teleport"] }));

    expect(JSON.parse(socket.sent[0]).effects).toEqual(["ledger"]);
  });

  interface TestWebSocketPair {
    0: WebSocket;
    1: WebSocket;
  }

  type TestWebSocketPairConstructor = new () => TestWebSocketPair;

  const globalWithWebSocketPair = globalThis as typeof globalThis & {
    WebSocketPair?: TestWebSocketPairConstructor;
  };

  it("only upgrades real WebSocket connect requests", async () => {
    const instance = new HouseholdPushDO(fakeState("household-1", []));

    const plain = await instance.fetch(
      new Request("https://push.internal/connect", { method: "GET" }),
    );
    expect(plain.status).toBe(400);

    globalWithWebSocketPair.WebSocketPair ??= class {
      0 = {} as WebSocket;
      1 = {} as WebSocket;
    };

    const originalResponse = globalThis.Response;
    class UpgradeResponse {
      readonly status: number;

      constructor(_body: BodyInit | null, init?: ResponseInit) {
        this.status = init?.status ?? 200;
      }
    }
    globalThis.Response = UpgradeResponse as unknown as typeof Response;
    try {
      const upgrade = await instance.fetch(
        new Request("https://push.internal/connect", {
          method: "GET",
          headers: { upgrade: "websocket" },
        }),
      );
      expect(upgrade.status).toBe(101);
    } finally {
      globalThis.Response = originalResponse;
    }
  });

  it("answers client liveness pings and ignores other messages", () => {
    const socket = fakeSocket();
    const instance = new HouseholdPushDO(fakeState("household-1", []));

    instance.webSocketMessage(socket as unknown as WebSocket, "ping");
    expect(socket.sent).toEqual(["pong"]);

    instance.webSocketMessage(socket as unknown as WebSocket, "hello");
    expect(socket.sent).toEqual(["pong"]);
  });
});
