# Performance Profile: Envelopes + Transactions (#211)

## Executive Summary

This document captures profiling findings for Envelopes and Transactions screens. Due to the Linux Cloud VM constraint, device-specific metrics (frame drops, UI thread CPU, React commit duration) could not be measured. Findings are categorized by confidence level.

**React Compiler Status**: ✅ **CONFIRMED ENABLED**

- `apps/mobile/app.config.ts` line 157: `reactCompiler: true`
- Per AGENTS.md: "Avoid `useMemo`/`useCallback` we use react-compiler to do it for us"
- Manual memoization should NOT be added without measured compiler bailout evidence

---

## Findings Summary

| Finding                          | Confidence      | Impact     | Location                     | Recommendation          |
| -------------------------------- | --------------- | ---------- | ---------------------------- | ----------------------- |
| N+1 query in envelope projection | **ALGORITHMIC** | High       | `envelope-projection.ts`     | Batch queries           |
| Repeated `.find()` in form       | **INFERRED**    | Low-Medium | `transaction-form.tsx`       | Measure first           |
| Non-virtualized envelope list    | **STRUCTURAL**  | Low        | `budget-overview-screen.tsx` | FlashList if >50 items  |
| Reanimated layout on each row    | **INFERRED**    | Unknown    | `envelope-row.tsx`           | Device profiling needed |

---

## Detailed Findings

### 1. N+1 Query Pattern in Envelope Projection

**Confidence**: ALGORITHMIC (code proves O(N×M) complexity)

**File**: `apps/mobile/modules/budgeting/envelope-projection.ts`

**Evidence**:

```typescript
// Lines 52-68: For EACH envelope, a separate SQL query executes
const summaries = await Promise.all(
  rows.map(async (row) => {
    const categories = await database.getAllAsync<CategoryMappingRow>(
      `SELECT ... FROM category_mappings ... WHERE envelope_id = ?`,
      row.id, // ← One query per envelope
      period,
      period,
    );
    // ...
  }),
);
```

**Impact**: For N envelopes, this executes N+1 database queries (1 for envelopes + N for mappings). With 50 envelopes, this is 51 SQLite round-trips.

**Recommended Fix**:

```typescript
// Batch: fetch all mappings in one query, then join in-memory
const allMappings = await database.getAllAsync<CategoryMappingRow>(
  `SELECT envelope_id, ... FROM category_mappings WHERE ...`,
);
const mappingsByEnvelope = groupBy(allMappings, "envelope_id");

const summaries = rows.map((row) => ({
  ...row,
  categoryIds: (mappingsByEnvelope[row.id] ?? []).map((m) => m.id),
}));
```

**Deferred**: Requires device profiling to measure actual latency improvement.

---

### 2. Repeated Array.find() in Transaction Form

**Confidence**: INFERRED (code analysis shows O(N) lookups)

**File**: `apps/mobile/components/transaction/transaction-form.tsx`

**Evidence**:

```typescript
// Line 140: Inside form.Subscribe render
const account = accounts.find((a) => a.id === accountId);

// Line 163: Another subscription
const category = categories.find((c) => c.id === categoryId);

// Lines 265-266: Yet another
const account = accounts.find((a) => a.id === accountId);
```

**Impact**: Each form subscription re-renders on field change. With 10 accounts and 50 categories, each keystroke triggers multiple O(N) lookups.

**Mitigation**: React Compiler may already optimize this. Benchmark tests show Array.find is acceptable for small arrays (<20 items).

**Recommendation**: Measure with React DevTools Profiler on device before optimizing. If accounts/categories exceed 20-30 items, convert to Map lookup.

---

### 3. Non-Virtualized Envelope List

**Confidence**: STRUCTURAL (code review)

**File**: `apps/mobile/components/envelopes/budget-overview-screen.tsx`

**Evidence**:

```typescript
// Line 66-70: Uses ScrollView, not FlashList
<ScrollView
  className="flex-1 bg-surface pt-safe-offset-20"
  contentContainerClassName="gap-5 px-5 pb-safe-offset-24"
>

// Line 158: Direct .map() rendering
{visibleEnvelopes.map((envelope) => (
  <EnvelopeRow key={envelope.id} envelope={envelope} ... />
))}
```

**Impact**: All envelopes render upfront. With 50+ envelopes, initial mount cost increases linearly.

**Comparison**: The Ledger tab uses FlashList correctly (`home-journal-list.tsx`).

**Recommendation**: If envelope counts can exceed ~30-50, migrate to FlashList. Current typical usage may be low enough that this is not a bottleneck.

---

### 4. Reanimated Layout Transitions on Each Envelope Row

**Confidence**: INFERRED (cannot measure animation cost on Linux VM)

**File**: `apps/mobile/components/envelopes/envelope-row.tsx`

**Evidence**:

```typescript
// Line 50: Every row gets entering/exiting/layout props
<Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
```

**Impact**: Unknown without device profiling. Layout animations calculate on every layout change.

**Recommendation**: Use Instruments (iOS) or systrace (Android) to measure layout animation overhead. If costly, consider removing `layout` prop from individual rows and applying only to the container.

---

## Hot Paths Not Requiring Immediate Action

### PowerSync Collections

- Collections use `syncMode: "eager"` with proper stream subscriptions
- `useLedgerRevision()` hook efficiently tracks collection changes via `useSyncExternalStore`
- No obvious O(N²) patterns in collection consumption

### NumPad

- Simple `useReducer`-based state management
- No re-render concerns identified

### Transaction Row

- Single component with minimal computation
- Used inside FlashList (virtualized)

### groupByDay / buildJournalList

- Benchmark tests confirm O(N) linear scaling
- 5000 transactions process in <100ms

---

## QA Profiling Steps (Device Required)

### Setup

1. Build release variant: `eas build --profile production --platform ios`
2. Install on physical iPhone (iPhone 12+ recommended)
3. Prepare test data: ledger with 50+ envelopes, 500+ transactions

### React DevTools Profiler

1. Connect React DevTools via Metro
2. Enable "Highlight updates when components render"
3. Navigate: Home → Envelopes → Create Transaction → Save
4. Record profiler session during each navigation
5. Capture: Commit duration, render counts, component tree depth

### Hermes Profiler (JS Thread)

1. Open Dev Menu → "Start Profiling"
2. Execute test flows (see issue #211)
3. Stop profiling → Export `.cpuprofile`
4. Analyze in Chrome DevTools → Performance tab

### iOS Instruments

1. Launch Instruments → Time Profiler template
2. Attach to running app process
3. Record during: Envelopes load, Move Money sheet, Transaction save
4. Check: Main thread time, off-main-thread work, layout passes

### Specific Flows to Profile

1. **Cold launch** → first Envelopes screen render
2. **Month change** → projection recomputation
3. **Move Money sheet** → assignment history load
4. **Transaction form** → numpad interaction latency
5. **PowerSync update** → collection change propagation

---

## Metrics to Capture

| Metric                    | Tool                           | Target                 |
| ------------------------- | ------------------------------ | ---------------------- |
| Time to interactive       | Manual stopwatch / Instruments | <500ms                 |
| JS thread frame drops     | Hermes Profiler                | <5% dropped            |
| React commit duration     | React DevTools                 | <16ms per commit       |
| Envelope projection query | SQLite trace                   | <50ms for 50 envelopes |
| List scroll FPS           | Instruments                    | 60fps sustained        |

---

## Files Changed for Instrumentation

- `apps/mobile/lib/profiling.ts` - Profiling utilities (DEV only)
- `apps/mobile/__tests__/performance/envelope-transactions-benchmarks.test.ts` - Algorithmic benchmarks

---

## Deferred Follow-ups

1. **Batch envelope category mapping queries** - Requires device profiling to validate impact
2. **FlashList for envelope list** - Only if envelope count exceeds 30-50
3. **Map lookup for accounts/categories** - Only if React Compiler bailout detected
4. **Reduce Reanimated layout props** - Only if Instruments shows layout overhead

---

## What Could NOT Be Measured on Linux VM

- Frame drops / jank during animations
- UI thread CPU utilization
- React Native bridge overhead
- Reanimated worklet execution time
- Real SQLite query latency (vs in-memory simulation)
- Memory growth during navigation
- Time-to-interactive on cold launch
- PowerSync sync latency

---

## Appendix: React Compiler Confirmation

```typescript
// apps/mobile/app.config.ts
export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    // ...
    experiments: {
      typedRoutes: true,
      reactCompiler: true, // ← ENABLED
    },
  };
};
```

Babel config (`babel.config.js`) uses `babel-preset-expo` which handles React Compiler integration when the experiment flag is set.
