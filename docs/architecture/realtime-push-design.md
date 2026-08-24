# Realtime Change Notification via a Household Durable Object

- **Status:** Accepted
- **Recorded:** 2026-08-24
- **Issue:** [#93](https://github.com/Stringsaeed/money-management/issues/93)
- **Domain language:** [Money Management Context](../../CONTEXT.md)
- **Related:** [Backend Architecture](./backend-architecture.md), `packages/protocol/src/effects.ts` (`ChangeNotification`)

## Decision

Add an optional, near-real-time push channel on top of the existing pull-based sync:
one Cloudflare Durable Object instance per household (`HouseholdPushDO`) holds that
household's WebSocket subscriptions. After a command commits, the pipeline publishes
a `{seq, effects[]}` notification to the household's channel; connected clients react
by pulling `sync.getDelta` immediately instead of waiting for the next 30s poll.

### Channel and message format

- Channel name: `household:{household_id}` (`householdChannel()` in `@trove/protocol`).
- One Durable Object per household, addressed with `idFromName(householdId)` — tenancy
  isolation falls out of the DO identity: a socket accepted by household A's object can
  never observe household B's publishes because B's notifications are delivered to a
  different object entirely.
- The wire message is a `HouseholdChangeNotice`: `{ channel, seq, effects }`. It carries
  **no raw row data** — clients must not trust push for state; they only use it as a
  trigger. The authoritative data always comes from the same `sync.getDelta` pull that
  polling performs.

### Publish is best-effort

The command pipeline takes an optional `publishChange` callback. Publishing happens
after the atomic batch commits and is wrapped so that any failure — DO unavailable,
network blip, serialization error — never fails or retries the mutation. A lost
notification costs one polling interval of latency, nothing more.

### Client subscription is best-effort

The mobile app opens a WebSocket to `/api/push/household/:householdId` after
authentication (the upgrade route re-checks session + household membership). Connection
failures, non-101 upgrades, malformed messages, and unknown channels are swallowed
silently: the 30s polling worker keeps running unchanged whether push is up, down, or
never deployed. Reconnects back off exponentially (1s → 30s cap) and reset on success.
The app behaves identically with push unavailable — push only changes _when_ a sync
turn triggers, never what it computes (#85 invariant).

## Consequences

- Polling remains the correctness floor; push is purely a latency optimization.
- No schema changes: notifications derive from the already-committed
  `household_changes` row (`seq`, `effects`).
- Hibernation-aware DO: sockets are attached via `state.acceptWebSocket` and broadcast
  reads `state.getWebSockets()`, so idle households cost nothing while connected.
- Deliberately deferred: message replay/catch-up inside the DO (clients reconcile via
  `since` anyway), presence indicators, per-user filtering inside the channel (delta
  pulls already enforce private-account visibility), and multi-region placement.
