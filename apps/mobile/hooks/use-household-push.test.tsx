import { act, renderHook } from "@testing-library/react-native";

import { useHouseholdPush } from "@/hooks/use-household-push";

jest.mock("@/modules/access", () => ({
  getAuthCookie: () => "money-management.session=fake",
}));

interface FakeMessageEvent {
  data: string;
}

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  static reset(): void {
    FakeWebSocket.instances = [];
  }

  static get last(): FakeWebSocket {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  }

  url: string;
  closed = false;
  onopen: (() => void) | null = null;
  onmessage: ((event: FakeMessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close(): void {
    this.closed = true;
  }

  /** Test helper: server pushes a raw message frame. */
  serverMessage(data: unknown): void {
    this.onmessage?.({ data: String(data) });
  }

  /** Test helper: the connection drops (server restart, network loss, non-101). */
  simulateClose(): void {
    if (!this.closed) {
      this.closed = true;
    }
    this.onclose?.();
  }

  /** Test helper: runtime reports a connection error without a close event. */
  simulateError(): void {
    this.onerror?.();
  }
}

const originalWebSocket = global.WebSocket;

describe("useHouseholdPush", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    FakeWebSocket.reset();
    global.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    jest.useRealTimers();
  });

  it("opens exactly one socket on the household's push channel", async () => {
    await renderHook(() => useHouseholdPush("h-1", jest.fn()));

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.last.url).toBe("ws://localhost:3000/api/push/household/h-1");
  });

  it("does not subscribe without an active household", async () => {
    await renderHook(() => useHouseholdPush(null, jest.fn()));

    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("triggers a pull for well-formed notices and ignores everything else", async () => {
    const onNotice = jest.fn();
    await renderHook(() => useHouseholdPush("h-1", onNotice));
    const socket = FakeWebSocket.last;

    socket.serverMessage(JSON.stringify({ channel: "household:h-1", seq: 7 }));
    expect(onNotice).toHaveBeenCalledTimes(1);

    socket.serverMessage("not json at all");
    socket.serverMessage(JSON.stringify({ channel: "household:other", seq: 8 }));
    socket.serverMessage(JSON.stringify({ channel: "household:h-1" }));
    socket.serverMessage(JSON.stringify({ seq: 9 }));
    expect(onNotice).toHaveBeenCalledTimes(1);

    socket.serverMessage(JSON.stringify({ channel: "household:h-1", seq: 10 }));
    expect(onNotice).toHaveBeenCalledTimes(2);
  });

  it("reconnects after a dropped connection with exponential backoff", async () => {
    await renderHook(() => useHouseholdPush("h-1", jest.fn()));

    FakeWebSocket.last.simulateClose();

    // First retry waits the 1s base.
    await act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(FakeWebSocket.instances).toHaveLength(2);

    // Second retry doubles to 2s.
    FakeWebSocket.last.simulateClose();
    await act(() => {
      jest.advanceTimersByTime(1_999);
    });
    expect(FakeWebSocket.instances).toHaveLength(2);
    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it("reconnects when the runtime emits only a connection error", async () => {
    await renderHook(() => useHouseholdPush("h-1", jest.fn()));

    FakeWebSocket.last.simulateError();
    await act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("caps the backoff at 30s", async () => {
    await renderHook(() => useHouseholdPush("h-1", jest.fn()));

    // Fail repeatedly until the delay saturates (1+2+4+8+16 < 5×31s of drift).
    for (let i = 0; i < 6; i++) {
      FakeWebSocket.last.simulateClose();
      await act(() => {
        jest.advanceTimersByTime(31_000);
      });
    }
    expect(FakeWebSocket.instances).toHaveLength(7);

    // At the cap, a 30s wait is still too short for the next attempt.
    FakeWebSocket.last.simulateClose();
    await act(() => {
      jest.advanceTimersByTime(29_999);
    });
    expect(FakeWebSocket.instances).toHaveLength(7);
    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(FakeWebSocket.instances).toHaveLength(8);
  });

  it("resets the backoff after a successful connection", async () => {
    await renderHook(() => useHouseholdPush("h-1", jest.fn()));

    // One failure escalates the pending delay to 2s…
    FakeWebSocket.last.simulateClose();
    await act(() => {
      jest.advanceTimersByTime(1_000);
    });
    // …but a successful open resets it before the next drop.
    FakeWebSocket.last.onopen?.();
    FakeWebSocket.last.simulateClose();

    await act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(FakeWebSocket.instances).toHaveLength(2);
    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it("closes the socket and stops reconnecting on unmount", async () => {
    const { unmount } = await renderHook(() => useHouseholdPush("h-1", jest.fn()));
    const socket = FakeWebSocket.last;

    socket.simulateClose();
    await unmount();

    expect(socket.closed).toBe(true);
    await act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
