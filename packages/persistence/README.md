# @statesync/persistence

Persistence layer for `@statesync/core` with automatic state caching, schema migration, cross-tab sync, and compression.

## Installation

```bash
pnpm add @statesync/persistence @statesync/core
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

// 4. Start sync - state will be automatically persisted
const sync = createRevisionSync({ ... applier ... });
await sync.start();

// 5. Cleanup when done
await applier.flush(); // Save pending data
applier.dispose();
```

## Storage Backends

### localStorage

```typescript
import { createLocalStorageBackend } from '@statesync/persistence';

const storage = createLocalStorageBackend({
  key: 'my-state',
  // Optional custom serialization
  serialize: (snapshot) => JSON.stringify(snapshot),
  deserialize: (data) => JSON.parse(data),
});
```

### IndexedDB

For larger data (>5MB):

```typescript
import { createIndexedDBBackend } from '@statesync/persistence';

const storage = createIndexedDBBackend({
  dbName: 'my-app',
  storeName: 'state-cache',
  version: 1,
  // Retry logic for blocked database
  retryAttempts: 3,
  onBlocked: () => console.warn('DB blocked, retrying...'),
});
```

### sessionStorage

For temporary state (cleared on tab close):

```typescript
import { createSessionStorageBackend } from '@statesync/persistence';

const storage = createSessionStorageBackend({ key: 'temp-state' });
```

### In-Memory (for testing)

```typescript
import { createMemoryStorageBackend } from '@statesync/persistence';

const storage = createMemoryStorageBackend({
  latencyMs: 50, // Simulate network delay
  failOnSave: false, // Toggle to test error handling
  maxSizeBytes: 1024 * 1024, // Simulate quota
});

// Test helpers
storage.getSavedSnapshots(); // Get all saved snapshots
storage.setFailMode({ save: true }); // Inject errors
storage.reset(); // Reset to initial state
```

## Throttling

Control save frequency to reduce storage I/O:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: {
    debounceMs: 300,    // Wait 300ms of "silence" before saving
    throttleMs: 1000,   // Maximum one save per second
    maxWaitMs: 5000,    // Force save after 5s of continuous updates
    leading: false,     // Don't save immediately on first update
  },
});
```

## Events & Observability

Subscribe to persistence events:

```typescript
const applier = createPersistenceApplier({ ... });

// Save lifecycle events
applier.on('saveStart', (snapshot) => {
  console.log('Saving revision:', snapshot.revision);
});

applier.on('saveComplete', (snapshot, durationMs) => {
  console.log(`Saved in ${durationMs}ms`);
});

applier.on('saveError', (error, snapshot) => {
  console.error('Save failed:', error);
});

// Get statistics
const stats = applier.getStats();
console.log({
  saveCount: stats.saveCount,
  saveErrorCount: stats.saveErrorCount,
  totalBytesSaved: stats.totalBytesSaved,
  lastSaveDurationMs: stats.lastSaveDurationMs,
});
```

## Schema Migration

Handle data format changes between app versions:

```typescript
import { createMigrationBuilder, loadPersistedSnapshot } from '@statesync/persistence';

// Define migrations
const migration = createMigrationBuilder<AppStateV3>()
  .addMigration(1, (v1) => ({ ...v1, newField: 'default' }))
  .addMigration(2, (v2) => ({ ...v2, enabled: true }))
  .withValidator((data): data is AppStateV3 => {
    return typeof data === 'object' && 'enabled' in data;
  })
  .build(3);

// Save with schema version
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  schemaVersion: 3, // Current version
});

// Load with automatic migration
const cached = await loadPersistedSnapshot(storage, applier, {
  migration,
});
```

## TTL (Time-To-Live)

Automatically expire cached data:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});

// Expired data won't be loaded
const cached = await loadPersistedSnapshot(storage, applier);
// Returns null if data is older than TTL
```

## Compression

Reduce storage usage with built-in LZ compression:

```typescript
import { createLZCompressionAdapter } from '@statesync/persistence';

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  compression: createLZCompressionAdapter(),
});
```

Or use external library (better compression):

```typescript
import LZString from 'lz-string';
import { createLZStringAdapter } from '@statesync/persistence';

const applier = createPersistenceApplier({
  compression: createLZStringAdapter(LZString),
});
```

Benchmark compression:

```typescript
import { benchmarkCompression, createLZCompressionAdapter } from '@statesync/persistence';

const adapter = createLZCompressionAdapter();
const result = benchmarkCompression(myJsonData, adapter);

console.log({
  ratio: result.ratio,           // 0.45 = 55% size reduction
  compressTimeMs: result.compressTimeMs,
  decompressTimeMs: result.decompressTimeMs,
});
```

## Cross-Tab Sync

Synchronize state between browser tabs:

```typescript
import { createCrossTabSync } from '@statesync/persistence';

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  crossTabSync: {
    channelName: 'my-app-state',
    receiveUpdates: true,  // Apply updates from other tabs
    broadcastSaves: true,  // Notify other tabs of saves
  },
});

// Or use the helper
const applier = createPersistenceApplierWithDefaults({
  storage,
  applier: innerApplier,
  topic: 'settings',
  enableCrossTab: true,
});
```

## Integrity Verification

Enable hash verification to detect corruption:

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  enableHash: true,
});

// Load with hash verification
const cached = await loadPersistedSnapshot(storage, applier, {
  verifyHash: true,
});
```

## Error Handling

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  onPersistenceError: (context) => {
    console.error(`${context.operation} failed:`, context.error);

    // Report to monitoring
    Sentry.captureException(context.error, {
      extra: { operation: context.operation },
    });
  },
});
```

## API Reference

### Storage Backends

| Function | Description |
|----------|-------------|
| `createLocalStorageBackend` | Browser localStorage (~5MB limit) |
| `createIndexedDBBackend` | IndexedDB with retry logic (~50MB+) |
| `createSessionStorageBackend` | Session-scoped storage |
| `createMemoryStorageBackend` | In-memory for testing |

### Persistence Applier

| Method | Description |
|--------|-------------|
| `apply(snapshot)` | Apply snapshot and schedule save |
| `dispose()` | Cleanup timers and resources |
| `flush()` | Force immediate save of pending data |
| `hasPendingSave()` | Check if save is pending |
| `on(event, handler)` | Subscribe to events |
| `getStats()` | Get persistence statistics |

### Utilities

| Function | Description |
|----------|-------------|
| `loadPersistedSnapshot` | Load and apply cached state |
| `clearPersistedData` | Clear storage with cross-tab notification |
| `migrateData` | Migrate data between schema versions |
| `lzCompress` / `lzDecompress` | Built-in LZ compression |
| `benchmarkCompression` | Measure compression performance |

## TypeScript Types

```typescript
import type {
  StorageBackend,
  StorageBackendWithMetadata,
  PersistenceApplierOptions,
  DisposablePersistenceApplier,
  PersistenceStats,
  PersistenceEvents,
  SaveThrottlingOptions,
  MigrationHandler,
  CompressionAdapter,
  LoadOptions,
} from '@statesync/persistence';
```

## License

MIT
