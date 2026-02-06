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
const sync = createRevisionSync({ ... applier ... });
await sync.start();
```

## Storage Backends

| Backend | Use Case | Limit |
|---------|----------|-------|
| `createLocalStorageBackend` | General use | ~5MB |
| `createIndexedDBBackend` | Large data | ~50MB+ |
| `createSessionStorageBackend` | Temporary (tab-scoped) | ~5MB |
| `createMemoryStorageBackend` | Testing | RAM |

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

const stats = applier.getStats();
// { saveCount, saveErrorCount, totalBytesSaved, lastSaveDurationMs }
```

## API Reference

See the [API docs](/api/persistence/) for full TypeDoc reference.

See the [Persistence with migrations](/examples/persistence-migration) example for schema versioning patterns.
