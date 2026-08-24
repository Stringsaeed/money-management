import { householdChannel, type HouseholdChangeNotice } from "@trove/protocol";

import { parseChangeNotification } from "./message";

/** Cloudflare Workers runtime global; locally declared for node-aware tooling. */
declare const WebSocketPair: new () => { 0: WebSocket; 1: WebSocket };

/**
 * One Durable Object instance per household: it owns that household's WebSocket
 * subscriptions and nothing else. Addressing is `idFromName(householdId)`, so
 * per-household isolation is structural — notifications for household B are
 * delivered to a different object and can never reach household A's sockets.
 */
export class HouseholdPushDO {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname.endsWith("/publish")) {
      return this.publish(request);
    }

    if (request.method === "GET" && url.pathname.endsWith("/connect")) {
      return this.connect(request);
    }

    return new Response("Not found", { status: 404 });
  }

  /** Broadcast one change notification to every connected socket. */
  private async publish(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const notice = parseChangeNotification(body);
    if (!notice) {
      return new Response("Expected {seq: number, effects: EffectTag[]}", { status: 400 });
    }

    const message = JSON.stringify(this.noticeFor(notice));
    for (const socket of this.state.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
    return new Response(null, { status: 204 });
  }

  /** Upgrade an authenticated request into a household subscription. */
  private connect(request: Request): Response {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 400 });
    }
    const pair = new WebSocketPair();
    // Hibernation-aware: attached sockets survive DO eviction, so an idle
    // household holds no memory while its clients stay connected.
    this.state.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  /** Hibernation handlers — the runtime revives the object to deliver these. */
  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    // Clients only send liveness pings; everything else is ignored.
    if (message === "ping" && socket.readyState === WebSocket.OPEN) {
      socket.send("pong");
    }
  }

  webSocketClose(): void {
    // Nothing to clean up: getWebSockets() reflects runtime state.
  }

  private noticeFor(notice: { seq: number; effects: HouseholdChangeNotice["effects"] }) {
    const noticePayload: HouseholdChangeNotice = {
      channel: this.channel(),
      seq: notice.seq,
      effects: notice.effects,
    };
    return noticePayload;
  }

  private channel(): string {
    return householdChannel(this.householdId());
  }

  private householdId(): string {
    return this.state.id.name ?? this.state.id.toString();
  }
}
