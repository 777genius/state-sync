---
title: Source of truth (in-memory)
---

# Source of truth (in-memory)

Platform-agnostic example demonstrating the core sync pattern without any framework dependencies.

**What it demonstrates:**
- Revision gate — old revisions are ignored
- Invalidation → refresh → apply cycle
- In-memory transport mock

::: tip
[View source on GitHub](https://github.com/777genius/state-sync/blob/main/docs/examples/source-of-truth.ts)
:::

## Full example

```typescript
import type {
  InvalidationEvent,
  InvalidationSubscriber,
  Revision,
  SnapshotApplier,
  SnapshotEnvelope,
  SnapshotProvider,
  Unsubscribe,
} from '@statesync/core';
import { createRevisionSync } from '@statesync/core';

// --- In-memory mock transport ---

type Handler = (e: InvalidationEvent) => void;

const handlers = new Set<Handler>();
let currentSnapshot: SnapshotEnvelope<{ counter: number }> = {
  revision: '1' as Revision,
  data: { counter: 1 },
};

const subscriber: InvalidationSubscriber = {
  async subscribe(handler: Handler): Promise<Unsubscribe> {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
};

const provider: SnapshotProvider<{ counter: number }> = {
  async getSnapshot() {
    return currentSnapshot;
  },
};

const applier: SnapshotApplier<{ counter: number }> = {
  apply(snapshot) {
    console.log(`[apply] revision=${snapshot.revision}, counter=${snapshot.data.counter}`);
  },
};

// --- Simulate backend ---

function simulateBackendUpdate(revision: string, counter: number) {
  currentSnapshot = {
    revision: revision as Revision,
    data: { counter },
  };

  // Broadcast invalidation to all subscribers
  for (const handler of handlers) {
    handler({
      topic: 'counters',
      revision: revision as Revision,
    });
  }
}

// --- Main ---

async function main() {
  const handle = createRevisionSync({
    topic: 'counters',
    subscriber,
    provider,
    applier,
    onError(ctx) {
      console.error(`[onError] phase=${ctx.phase}`, ctx.error);
    },
  });

  // Start: subscribe + initial snapshot fetch
  await handle.start();
  console.log(`[main] local revision after start: ${handle.getLocalRevision()}`);

  // Simulate updates
  simulateBackendUpdate('5', 5);

  // Wait for async refresh
  await new Promise((r) => setTimeout(r, 50));
  console.log(`[main] local revision after update: ${handle.getLocalRevision()}`);

  // Old revision → ignored (revision gate)
  simulateBackendUpdate('3', 3);
  await new Promise((r) => setTimeout(r, 50));
  console.log(`[main] local revision after stale event: ${handle.getLocalRevision()}`);

  handle.stop();
  console.log('[main] stopped');
}

main().catch(console.error);
```

## Expected output

```
[apply] revision=1, counter=1
[main] local revision after start: 1
[apply] revision=5, counter=5
[main] local revision after update: 5
[main] local revision after stale event: 5   // ← revision 3 was ignored
[main] stopped
```

## Key points

1. **Revision gate**: When `simulateBackendUpdate('3', 3)` is called after revision 5, the engine ignores it because 3 < 5.

2. **Invalidation pattern**: Backend doesn't push full state — only `{ topic, revision }`. Consumer pulls snapshot only when needed.

3. **Decoupled architecture**: `subscriber`, `provider`, and `applier` are separate concerns that can be swapped independently.

## See also

- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
- [Custom transports](/guide/custom-transports) — real transport implementations (WebSocket, SSE, Tauri)
- [Quickstart](/guide/quickstart) — wiring with a framework adapter
