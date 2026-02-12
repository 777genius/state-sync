---
title: Testing
---

# Testing

How to unit test your state-sync integrations using vitest.

## Mocking the three parts

state-sync's subscriber/provider/applier pattern makes testing straightforward — each part is a plain object with one method.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createRevisionSync } from '@statesync/core';
import type { Revision } from '@statesync/core';

describe('sync integration', () => {
  it('applies initial snapshot on start', async () => {
    const applySpy = vi.fn();

    const sync = createRevisionSync({
      topic: 'test',
      subscriber: {
        async subscribe() {
          return () => {}; // no-op unsubscribe
        },
      },
      provider: {
        async getSnapshot() {
          return { revision: '1' as Revision, data: { count: 42 } };
        },
      },
      applier: { apply: applySpy },
    });

    await sync.start();

    expect(applySpy).toHaveBeenCalledWith({
      revision: '1',
      data: { count: 42 },
    });
    expect(sync.getLocalRevision()).toBe('1');

    sync.stop();
  });
});
```

## Simulating invalidation events

Capture the handler from `subscribe()` to trigger events manually:

```typescript
it('refreshes on invalidation event', async () => {
  let revision = 1;
  let triggerInvalidation: (e: { topic: string; revision: string }) => void;

  const sync = createRevisionSync({
    topic: 'counter',
    subscriber: {
      async subscribe(handler) {
        triggerInvalidation = handler; // [!code highlight]
        return () => {};
      },
    },
    provider: {
      async getSnapshot() {
        return {
          revision: String(revision) as Revision,
          data: { value: revision },
        };
      },
    },
    applier: {
      apply(snapshot) {
        // assert or spy here
      },
    },
  });

  await sync.start();
  expect(sync.getLocalRevision()).toBe('1');

  // Simulate backend update
  revision = 5;
  triggerInvalidation!({ topic: 'counter', revision: '5' });

  // Wait for async refresh
  await new Promise((r) => setTimeout(r, 10));
  expect(sync.getLocalRevision()).toBe('5');

  sync.stop();
});
```

## Testing with structural interfaces

Framework adapters use structural interfaces — no framework imports needed for testing:

```typescript
import { createZustandSnapshotApplier } from '@statesync/zustand';
import type { Revision } from '@statesync/core';

it('applies snapshot to a mock zustand store', () => {
  // Satisfies ZustandStoreLike — no zustand import needed // [!code highlight]
  let state = { count: 0, name: 'test' };
  const mockStore = {
    getState: () => state,
    setState: (partial: any, replace?: boolean) => {
      if (replace) {
        state = partial;
      } else {
        state = { ...state, ...partial };
      }
    },
  };

  const applier = createZustandSnapshotApplier(mockStore, {
    mode: 'patch',
    omitKeys: ['name'],
  });

  applier.apply({
    revision: '1' as Revision,
    data: { count: 42, name: 'ignored' },
  });

  expect(state.count).toBe(42);
  expect(state.name).toBe('test'); // omitKeys preserved
});
```

Works the same for other adapters — including Redux:

```typescript
import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';
import type { Revision } from '@statesync/core';

it('applies snapshot to a mock redux store', () => {
  const reducer = (state = { count: 0, name: 'test' }, action: any) => {
    return state;
  };
  const wrapped = withSnapshotHandling(reducer);
  let state = { count: 0, name: 'test' };
  const mockStore = {
    getState: () => state,
    dispatch: (action: any) => { state = wrapped(state, action); return action; },
  };

  const applier = createReduxSnapshotApplier(mockStore, {
    mode: 'patch',
    omitKeys: ['name'],
  });

  applier.apply({
    revision: '1' as Revision,
    data: { count: 42, name: 'ignored' },
  });

  expect(state.count).toBe(42);
  expect(state.name).toBe('test'); // omitKeys preserved
});
```

More structural interface examples:

```typescript
import { createPiniaSnapshotApplier } from '@statesync/pinia';

// Satisfies PiniaStoreLike
const mockPiniaStore = {
  $state: { theme: 'light' },
  $patch: (partial: any) => {
    Object.assign(mockPiniaStore.$state, partial);
  },
};
```

```typescript
import { createVueSnapshotApplier } from '@statesync/vue';

// Satisfies VueRefLike
const mockRef = { value: { count: 0 } };

const applier = createVueSnapshotApplier(mockRef, {
  target: 'ref',
  mode: 'patch',
});
```

## Memory storage backend

`createMemoryStorageBackend` is purpose-built for testing persistence logic. It supports latency simulation, error injection, quota limits, and inspection methods.

```typescript
import { createMemoryStorageBackend } from '@statesync/persistence';
import type { Revision } from '@statesync/core';

it('saves and loads snapshots', async () => {
  const storage = createMemoryStorageBackend();

  await storage.save({
    revision: '1' as Revision,
    data: { theme: 'dark' },
  });

  const loaded = await storage.load();
  expect(loaded?.data).toEqual({ theme: 'dark' });

  // Inspect save history
  expect(storage.getSavedSnapshots()).toHaveLength(1); // [!code highlight]
});
```

### Pre-populated storage

```typescript
const storage = createMemoryStorageBackend({
  initialSnapshot: { revision: '5' as Revision, data: { cached: true } },
});

const loaded = await storage.load();
expect(loaded?.revision).toBe('5');
```

### Simulated latency

```typescript
const storage = createMemoryStorageBackend({ latencyMs: 100 });

const start = Date.now();
await storage.load();
expect(Date.now() - start).toBeGreaterThanOrEqual(90);
```

### Quota simulation

```typescript
const storage = createMemoryStorageBackend({ maxSizeBytes: 50 });

await expect(
  storage.save({ revision: '1' as Revision, data: { huge: 'x'.repeat(100) } }),
).rejects.toThrow('quota exceeded');
```

## Dynamic error injection with setFailMode

Toggle failures at any point during a test — no need to create a new storage instance:

```typescript
it('handles save failure gracefully', async () => {
  const storage = createMemoryStorageBackend();

  // Save works initially
  await storage.save({ revision: '1' as Revision, data: { ok: true } });
  expect(storage.getSavedSnapshots()).toHaveLength(1);

  // Enable failure // [!code highlight]
  storage.setFailMode({ save: true }); // [!code highlight]

  await expect(
    storage.save({ revision: '2' as Revision, data: { ok: false } }),
  ).rejects.toThrow('Simulated storage error');

  // Disable failure // [!code highlight]
  storage.setFailMode({ save: false }); // [!code highlight]

  await storage.save({ revision: '3' as Revision, data: { recovered: true } });
  expect(storage.getSavedSnapshots()).toHaveLength(2);
});
```

### Inspecting raw metadata

```typescript
const storage = createMemoryStorageBackend();
await storage.save({ revision: '1' as Revision, data: { count: 0 } });

const raw = storage.getRawData(); // [!code highlight]
expect(raw?.metadata.schemaVersion).toBe(1);
expect(raw?.metadata.compressed).toBe(false);
expect(raw?.metadata.sizeBytes).toBeGreaterThan(0);
```

### Reset between tests

```typescript
afterEach(() => {
  storage.reset(); // Clears data, resets fail modes, clears save history // [!code highlight]
});
```

## Shared memory storage

`createSharedMemoryStorage` provides a single in-memory store shared across multiple backend instances — useful for testing multi-component scenarios:

```typescript
import { createSharedMemoryStorage } from '@statesync/persistence';

it('shares state between components', async () => {
  const shared = createSharedMemoryStorage();

  const storageA = shared.getBackend('settings'); // [!code highlight]
  const storageB = shared.getBackend('settings'); // [!code highlight]

  await storageA.save({ revision: '1' as Revision, data: { theme: 'dark' } });

  const loaded = await storageB.load();
  expect(loaded?.data).toEqual({ theme: 'dark' }); // Same key = shared data

  shared.clearAll(); // Cleanup
});
```

## Testing error scenarios by phase

```typescript
it('reports getSnapshot errors with correct phase', async () => {
  const errors: { phase: string; error: unknown }[] = [];

  const sync = createRevisionSync({
    topic: 'test',
    subscriber: {
      async subscribe() {
        return () => {};
      },
    },
    provider: {
      async getSnapshot() {
        throw new Error('Network timeout');
      },
    },
    applier: { apply() {} },
    onError(ctx) {
      errors.push({ phase: ctx.phase, error: ctx.error }); // [!code highlight]
    },
  });

  await expect(sync.start()).rejects.toThrow('Network timeout');

  expect(errors[0].phase).toBe('getSnapshot'); // [!code highlight]
  expect((errors[0].error as Error).message).toBe('Network timeout');
});
```

### Protocol errors

```typescript
it('reports protocol error for invalid revision', async () => {
  const errors: string[] = [];

  const sync = createRevisionSync({
    topic: 'test',
    subscriber: { async subscribe() { return () => {}; } },
    provider: {
      async getSnapshot() {
        return { revision: '01', data: {} }; // Leading zero — invalid! // [!code error]
      },
    },
    applier: { apply() {} },
    onError(ctx) {
      errors.push(ctx.phase);
    },
  });

  await expect(sync.start()).rejects.toThrow('Non-canonical');
  expect(errors).toContain('protocol');
});
```

## Testing migrations

`migrateData()` can be tested directly without any storage or sync setup:

```typescript
import { createMigrationBuilder, migrateData } from '@statesync/persistence';

interface SettingsV1 { darkMode: boolean }
interface SettingsV2 { theme: 'light' | 'dark'; language: string }

const migration = createMigrationBuilder<SettingsV2>()
  .addMigration<SettingsV1, SettingsV2>(1, (v1) => ({
    theme: v1.darkMode ? 'dark' : 'light',
    language: 'en',
  }))
  .build(2);

describe('settings migration', () => {
  it('migrates v1 to v2', () => {
    const result = migrateData({ darkMode: true }, 1, migration);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ theme: 'dark', language: 'en' });
  });

  it('returns v2 unchanged', () => {
    const v2 = { theme: 'light' as const, language: 'es' };
    const result = migrateData(v2, 2, migration);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(v2);
  });

  it('fails for future versions', () => {
    const result = migrateData({}, 99, migration);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('future version');
  });
});
```

## Testing throttling with fake timers

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRevisionSync } from '@statesync/core';
import type { Revision } from '@statesync/core';

describe('throttled sync', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.restoreAllTimers(); });

  it('debounces rapid invalidation events', async () => {
    let fetchCount = 0;
    let triggerInvalidation: (e: { topic: string; revision: string }) => void;

    const sync = createRevisionSync({
      topic: 'metrics',
      subscriber: {
        async subscribe(handler) {
          triggerInvalidation = handler;
          return () => {};
        },
      },
      provider: {
        async getSnapshot() {
          fetchCount++;
          return { revision: String(fetchCount) as Revision, data: {} };
        },
      },
      applier: { apply() {} },
      throttling: { debounceMs: 200 }, // [!code highlight]
    });

    await sync.start();
    const initialFetches = fetchCount; // 1 (initial refresh)

    // Fire 10 rapid events
    for (let i = 0; i < 10; i++) {
      triggerInvalidation!({ topic: 'metrics', revision: String(100 + i) });
    }

    // Before debounce fires — no extra fetches
    expect(fetchCount).toBe(initialFetches);

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(250);

    // Only 1 additional fetch (debounced), not 10
    expect(fetchCount).toBeLessThanOrEqual(initialFetches + 2); // [!code highlight]

    sync.stop();
  });
});
```

## See also

- [Source of truth example](/examples/source-of-truth) — in-memory transport pattern
- [Error handling](/examples/error-handling) — retry and graceful degradation
- [Persistence with migrations](/examples/persistence-migration) — migration testing patterns
- [@statesync/persistence](/packages/persistence) — storage backends API
