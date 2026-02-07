---
title: Throttling & coalescing
---

# Throttling & coalescing

Control how often state-sync refreshes when invalidation events arrive rapidly.

## The problem

Backend emits 100 events per second. Without throttling, the engine calls `getSnapshot()` 100 times. Most of those calls fetch the same data.

## Throttling options

```typescript
import { createRevisionSync } from '@statesync/core';

const sync = createRevisionSync({
  topic: 'metrics',
  subscriber,
  provider,
  applier,
  throttling: {
    debounceMs: 200,  // Wait 200ms of silence before refresh
    throttleMs: 1000, // At most 1 refresh per second
    leading: true,    // Fire immediately on first event (default)
    trailing: true,   // Fire after quiet period ends (default)
  },
});
```

## What each option does

| Option | Effect | Default |
|--------|--------|---------|
| `debounceMs` | Waits N ms of silence before triggering refresh | — |
| `throttleMs` | At most 1 refresh per N ms | — |
| `leading` | Fire immediately on first event | `true` |
| `trailing` | Fire after quiet period ends | `true` |

## Visual: 10 events in 500ms

```
Events:  ×  ×  ×  ×  ×  ×  ×  ×  ×  ×
Time:    0  50 100 150 200 250 300 350 400 450   700ms

No throttling:     10 refreshes ❌
debounceMs: 200:    1 refresh at ~650ms (200ms after last event)
throttleMs: 500:    2 refreshes (at 0ms and 500ms)
Both combined:      2 refreshes (leading at 0ms, trailing at ~650ms)
```

## Example: fast-updating dashboard

```typescript
import type { InvalidationSubscriber, SnapshotProvider, Revision } from '@statesync/core';
import { createRevisionSync, createConsoleLogger } from '@statesync/core';

// Mock: backend sends events every 50ms
let revision = 0;
const handlers = new Set<(e: { topic: string; revision: string }) => void>();

const subscriber: InvalidationSubscriber = {
  async subscribe(handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
};

let fetchCount = 0;
const provider: SnapshotProvider<{ value: number }> = {
  async getSnapshot() {
    fetchCount++;
    console.log(`  getSnapshot() called (total: ${fetchCount})`);
    return { revision: revision.toString() as Revision, data: { value: revision } };
  },
};

const applier = {
  apply(snapshot: { revision: string; data: { value: number } }) {
    console.log(`  applied: revision=${snapshot.revision}`);
  },
};

// --- Without throttling ---
const syncNoThrottle = createRevisionSync({
  topic: 'demo',
  subscriber, provider, applier,
});

// --- With throttling ---
const syncThrottled = createRevisionSync({
  topic: 'demo',
  subscriber, provider, applier,
  throttling: { debounceMs: 200, throttleMs: 500 },
});

// Simulate 10 rapid events
function simulateBurst() {
  for (let i = 0; i < 10; i++) {
    revision++;
    for (const h of handlers) {
      h({ topic: 'demo', revision: revision.toString() });
    }
  }
}
```

## Expected behavior

```
Without throttling:
  getSnapshot() called (total: 1)   // coalescing still helps:
  getSnapshot() called (total: 2)   // engine queues at most 1 pending refresh
  applied: revision=10

With throttling (debounceMs: 200, throttleMs: 500):
  getSnapshot() called (total: 1)   // leading: immediate
  applied: revision=10              // gets latest revision
  // ...200ms of silence...
  getSnapshot() called (total: 2)   // trailing: fires once after debounce
  applied: revision=10              // same revision, no-op (revision gate)
```

Even without throttling, the engine's built-in **coalescing** ensures at most 1 queued refresh. Throttling adds an extra layer — useful when even 2 refreshes per burst is too many.

## When to use what

| Scenario | Config |
|----------|--------|
| Backend emits rarely (< 1/sec) | No throttling needed |
| Moderate updates (1-10/sec) | `debounceMs: 100` |
| High-frequency updates (10-100/sec) | `throttleMs: 500` |
| Bursty + long pauses | `debounceMs: 200` + `throttleMs: 1000` |
| User typing (save on pause) | `debounceMs: 500, leading: false` |

## Key points

1. **Coalescing is always on** — even without throttling, the engine queues at most 1 refresh while another is in flight.

2. **Throttling adds delay control** — `debounceMs` waits for silence, `throttleMs` sets max frequency.

3. **leading + trailing** — `leading: true` gives instant response, `trailing: true` ensures the final state is always applied.

4. **Revision gate is the safety net** — if throttled refresh fetches the same revision, the applier is not called.

## See also

- [How state-sync works](/guide/protocol) — coalescing and revision gate explained
- [Lifecycle contract](/lifecycle) — `throttle` error phase
- [Source of truth](/examples/source-of-truth) — basic revision gate demo
