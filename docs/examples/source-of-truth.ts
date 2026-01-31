/**
 * Platform-agnostic example: in-memory transport + engine lifecycle.
 *
 * Demonstrates:
 * - Revision gate (old revisions are ignored)
 * - Invalidation → refresh → apply cycle
 * - Coalescing (burst invalidations → max 2 getSnapshot)
 * - Error handling via the onError callback
 */
import type {
  InvalidationEvent,
  InvalidationSubscriber,
  Revision,
  SnapshotApplier,
  SnapshotEnvelope,
  SnapshotProvider,
  Unsubscribe,
} from 'state-sync';
import { createRevisionSync } from 'state-sync';

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

  // Old revision → ignored
  simulateBackendUpdate('3', 3);
  await new Promise((r) => setTimeout(r, 50));
  console.log(`[main] local revision after stale event: ${handle.getLocalRevision()}`);

  handle.stop();
  console.log('[main] stopped');
}

main().catch(console.error);
