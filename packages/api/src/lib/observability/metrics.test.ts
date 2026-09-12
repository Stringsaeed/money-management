import { describe, expect, it } from "vitest";

import type { CommandResult } from "@trove/protocol";

import {
  createBufferSink,
  createConsoleSink,
  instrumentCommandApply,
  rejectionReason,
  type MetricEvent,
} from "./metrics";

describe("metrics", () => {
  it("records a typed rejection with kind and reason for a rejected command", async () => {
    const sink = createBufferSink();
    const result: CommandResult = {
      kind: "stale_version",
      entityId: "acc-1",
      expectedVersion: 3,
      actualVersion: 7,
    };

    await instrumentCommandApply(
      sink,
      () => Promise.resolve(result),
      () => 0,
      () => 42,
    );

    expect(sink.events).toContainEqual<MetricEvent>({
      event: "command_rejection",
      rejectionKind: "stale_version",
      reason: "expected_version_3_actual_7",
    });
  });

  it("records latency samples with the outcome tag for applied commands", async () => {
    const sink = createBufferSink();
    const result: CommandResult = {
      kind: "applied",
      seq: 1,
      effects: [],
      applied: {},
      replayed: false,
    };

    await instrumentCommandApply(
      sink,
      () => Promise.resolve(result),
      () => 100,
      () => 145,
    );

    expect(sink.events).toEqual([
      { event: "latency_sample", operation: "commands.apply", durationMs: 45, outcome: "applied" },
    ]);
  });

  it("counts rejection frequency by emitting one event per rejected call", async () => {
    const sink = createBufferSink();
    const forbidden: CommandResult = {
      kind: "forbidden",
      role: "viewer",
      requiredCapability: "transaction.create",
    };

    await instrumentCommandApply(
      sink,
      () => Promise.resolve(forbidden),
      () => 0,
      () => 1,
    );
    await instrumentCommandApply(
      sink,
      () => Promise.resolve(forbidden),
      () => 0,
      () => 2,
    );
    await instrumentCommandApply(
      sink,
      () => Promise.resolve(forbidden),
      () => 0,
      () => 3,
    );

    const rejections = sink.events.filter((e) => e.event === "command_rejection");
    expect(rejections).toHaveLength(3);
    expect(rejections.every((e) => e.rejectionKind === "forbidden")).toBe(true);
  });

  it("records an operation failure when the pipeline throws instead of rejecting", async () => {
    const sink = createBufferSink();

    await expect(
      instrumentCommandApply(
        sink,
        () => Promise.reject(new Error("d1 unavailable")),
        () => 0,
        () => 12,
      ),
    ).rejects.toThrow("d1 unavailable");

    expect(sink.events).toContainEqual({
      event: "operation_failure",
      operation: "commands.apply",
      reason: "d1 unavailable",
    });
    expect(sink.events).toContainEqual({
      event: "latency_sample",
      operation: "commands.apply",
      durationMs: 12,
      outcome: "error",
    });
  });

  it("derives short reasons for every rejection kind without leaking payloads", () => {
    expect(
      rejectionReason({ kind: "invalid_intent", issues: [{ field: "amount", message: "x" }] }),
    ).toBe("amount");
    expect(rejectionReason({ kind: "missing_entity", entityType: "account", entityId: "a" })).toBe(
      "account:a",
    );
    expect(rejectionReason({ kind: "conflict", reason: "unassigned_money_changed" })).toBe(
      "unassigned_money_changed",
    );
    expect(rejectionReason({ kind: "local_only", reason: "kill_switch_local_only" })).toBe(
      "kill_switch_local_only",
    );
  });

  it("logs flat single-line JSON with metric:true for kill_switch_engaged", () => {
    const lines: string[] = [];
    const sink = createConsoleSink((line) => {
      lines.push(line);
    });

    sink.record({ event: "kill_switch_engaged" });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!)).toEqual({ metric: true, event: "kill_switch_engaged" });
  });

  it("spreads latency_sample fields into the logged metric object", () => {
    const lines: string[] = [];
    const sink = createConsoleSink((line) => {
      lines.push(line);
    });

    sink.record({
      event: "latency_sample",
      operation: "commands.apply",
      durationMs: 17,
      outcome: "applied",
    });

    expect(JSON.parse(lines[0]!)).toEqual({
      metric: true,
      event: "latency_sample",
      operation: "commands.apply",
      durationMs: 17,
      outcome: "applied",
    });
  });
});
