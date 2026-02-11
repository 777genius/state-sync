---
title: "@statesync/persistence"
---

# @statesync/persistence

Persistence layer for state-sync with automatic caching, schema migration, cross-tab sync, and compression.

## Installation

```bash
npm install @statesync/persistence @statesync/core
```

## Quick Start

```typescript
import { createRevisionSync } from '@statesync/core';
import {
  createPersistenceApplier,
  createLocalStorageBackend,
  loadPersistedSnapshot,
} from '@statesync/persistence';

// 1. Create storage backend
const storage = createLocalStorageBackend({ key: 'my-app-state' });

// 2. Wrap your applier with persistence
const applier = createPersistenceApplier({
  storage,
  applier: myInnerApplier,
  throttling: { debounceMs: 300 },
});

// 3. Load cached state before starting sync
const cached = await loadPersistedSnapshot(storage, applier);
if (cached) {
  console.log('Restored from cache:', cached.revision);
}

// 4. Start sync
const sync = createRevisionSync({ topic: 'app', subscriber, provider, applier });
await sync.start();

// 5. Clean up when done
applier.dispose();
```

## Storage Backends

| Backend | Use Case | Limit |
|---------|----------|-------|
| `createLocalStorageBackend` | General use | ~5MB |
| `createIndexedDBBackend` | Large data | ~50MB+ |
| `createSessionStorageBackend` | Temporary (tab-scoped) | ~5MB |
| `createMemoryStorageBackend` | Testing | RAM |

Each backend accepts an options object:

```typescript
// LocalStorage
createLocalStorageBackend({ key: 'my-key' });

// IndexedDB
createIndexedDBBackend({ dbName: 'my-db', storeName: 'state', key: 'my-key' });

// SessionStorage
createSessionStorageBackend({ key: 'my-key' });

// Memory (for tests)
createMemoryStorageBackend();
// Shared memory (for multi-instance tests)
createSharedMemoryStorage();
```

## Persistence Applier Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storage` | `StorageBackend<T>` | required | Storage backend |
| `applier` | `SnapshotApplier<T>` | required | Inner applier to delegate to |
| `throttling` | `SaveThrottlingOptions` | — | Control save frequency |
| `debounceMs` | `number` | — | *Deprecated:* use `throttling.debounceMs` |
| `schemaVersion` | `number` | `1` | Schema version for migrations |
| `ttlMs` | `number` | — | Cache time-to-live in ms |
| `compression` | `CompressionAdapter` | — | Compression adapter |
| `enableHash` | `boolean` | `false` | Non-cryptographic integrity hash |
| `crossTabSync` | `CrossTabSyncOptions` | — | Cross-tab sync via BroadcastChannel |
| `onPersistenceError` | `(ctx) => void` | — | Error handler for persistence ops |

### DisposablePersistenceApplier

The returned applier has extra methods:

| Method | Description |
|--------|-------------|
| `dispose()` | Cancel pending saves, clean up timers |
| `hasPendingSave()` | `true` if a save is scheduled |
| `flush()` | Force immediate save of pending snapshot |
| `on(event, handler)` | Subscribe to persistence events |
| `getStats()` | Get save counts, byte totals, timing |

## Features

### Throttling

Control save frequency to reduce I/O:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: {
    debounceMs: 300,    // Wait for silence
    throttleMs: 1000,   // Max one save/sec
    maxWaitMs: 5000,    // Force save after 5s
    leading: false,     // Don't save on first update
  },
});
```

### Schema Migration

Handle data format changes:

```typescript
import { createMigrationBuilder } from '@statesync/persistence';

const migration = createMigrationBuilder<AppStateV3>()
  .addMigration(1, (v1) => ({ ...v1, newField: 'default' }))
  .addMigration(2, (v2) => ({ ...v2, enabled: true }))
  .build(3);

const cached = await loadPersistedSnapshot(storage, applier, { migration });
```

Additional migration utilities:

```typescript
import {
  createSimpleMigration,
  migrateData,
  needsMigration,
  getMigrationPath,
} from '@statesync/persistence';

// Check if migration is needed
if (needsMigration(storedVersion, handler.currentVersion)) {
  const result = migrateData(data, storedVersion, handler);
  if (result.success) {
    // use result.data
  }
}
```

### Compression

Reduce storage usage:

```typescript
import { createLZCompressionAdapter } from '@statesync/persistence';

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  compression: createLZCompressionAdapter(),
});
```

Other compression utilities:

```typescript
import {
  createCompressionAdapter,
  createBase64Adapter,
  createNoCompressionAdapter,
  lzCompress,
  lzDecompress,
  benchmarkCompression,
  estimateCompressionRatio,
} from '@statesync/persistence';
```

### Cross-Tab Sync

Synchronize state between browser tabs via BroadcastChannel:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  crossTabSync: {
    channelName: 'my-app-state',
    receiveUpdates: true,
    broadcastSaves: true,
  },
});
```

Standalone cross-tab utilities:

```typescript
import { createCrossTabSync, isBroadcastChannelSupported } from '@statesync/persistence';

if (isBroadcastChannelSupported()) {
  const crossTab = createCrossTabSync({ channelName: 'my-channel' });
}
```

### TTL (Time-To-Live)

Expire cached data automatically:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Events & Stats

```typescript
applier.on('saveComplete', (snapshot, durationMs) => {
  console.log(`Saved in ${durationMs}ms`);
});

applier.on('saveError', (error, snapshot) => {
  console.error('Save failed:', error);
});

applier.on('expired', (snapshot, age) => {
  console.log(`Cache expired after ${age}ms`);
});

const stats = applier.getStats();
// { saveCount, saveErrorCount, totalBytesSaved, lastSaveAt, lastSaveDurationMs, throttledCount }
```

### Convenience helpers

```typescript
import {
  clearPersistedData,
  createPersistenceApplierWithDefaults,
} from '@statesync/persistence';

// Clear stored data
await clearPersistedData(storage);

// Create applier with sensible defaults
const applier = createPersistenceApplierWithDefaults({
  storage,
  applier: innerApplier,
});
```

## API Reference

See the [API docs](/api/persistence/) for full TypeDoc reference.

See the [Persistence with migrations](/examples/persistence-migration) example for schema versioning patterns.
