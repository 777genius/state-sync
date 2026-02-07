---
title: Persistence stack
---

# Persistence stack

Combine compression, TTL, cross-tab sync, and cached load into a single persistence setup.

## What @statesync/persistence gives you

| Feature | What it does |
|---------|-------------|
| **Storage backends** | localStorage, IndexedDB, sessionStorage, memory |
| **Compression** | Built-in LZ compression (~40-60% smaller) |
| **TTL** | Auto-expire cached data after N hours |
| **Cross-tab sync** | BroadcastChannel between tabs (no manual setup) |
| **Cached load** | Instant UI from cache before sync starts |
| **Events** | `saveComplete`, `migrated` |

## Full setup

```typescript
import { createRevisionSync, createConsoleLogger } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import {
  createPersistenceApplier,
  createLocalStorageBackend,
  createLZCompressionAdapter,
  loadPersistedSnapshot,
} from '@statesync/persistence';
import { useSettingsStore } from './stores/settings';

// 1. Storage backend
const storage = createLocalStorageBackend({ key: 'app-settings' });

// 2. Inner applier (framework adapter)
const innerApplier = createZustandSnapshotApplier(useSettingsStore, {
  mode: 'patch',
  omitKeys: ['isLoading', 'error'],
});

// 3. Wrap with persistence
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,

  // Compress before saving (~40-60% smaller)
  compression: createLZCompressionAdapter(),

  // Expire after 24 hours
  ttlMs: 24 * 60 * 60 * 1000,

  // Sync across browser tabs automatically
  crossTabSync: {
    channelName: 'settings-sync',
    receiveUpdates: true,   // Apply snapshots from other tabs
    broadcastSaves: true,   // Notify other tabs on save
  },

  // Don't save on every event — wait for 300ms silence
  throttling: { debounceMs: 300 },
});

// 4. Load cache BEFORE starting sync (instant UI)
const cached = await loadPersistedSnapshot(storage, innerApplier);
if (cached) {
  console.log(`Restored from cache: revision ${cached.revision}`);
}

// 5. Start live sync
const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier, // persistence-wrapped applier
  logger: createConsoleLogger({ debug: true }),
});

await sync.start();
```

## What happens at runtime

```
Tab opens:
  1. loadPersistedSnapshot → decompress → apply cached data (instant UI)
  2. sync.start() → subscribe + fetch fresh snapshot
  3. If fresh revision > cached revision → apply + compress + save
  4. If same revision → no-op (revision gate)

Snapshot applied:
  1. innerApplier.apply(snapshot) → Zustand store updated
  2. Wait 300ms (throttling)
  3. Compress data with LZ
  4. Save to localStorage
  5. Broadcast to other tabs via BroadcastChannel

Other tab receives broadcast:
  1. BroadcastChannel message arrives
  2. Persistence applier calls innerApplier.apply(snapshot)
  3. No extra save (avoids ping-pong)
```

## Compression comparison

```typescript
// Without compression:
localStorage.setItem('settings', JSON.stringify(snapshot));
// Size: ~2.4KB for typical settings object

// With createLZCompressionAdapter():
localStorage.setItem('settings', compressed);
// Size: ~1.1KB (54% reduction)
```

Built-in LZ compression has no external dependencies. For better ratios, use `createLZStringAdapter()` with the `lz-string` library.

## Events & stats

```typescript
// Track save performance
applier.on('saveComplete', (snapshot, durationMs) => {
  console.log(`Saved revision ${snapshot.revision} in ${durationMs}ms`);
});

// Get persistence stats
const stats = applier.getStats();
console.log(stats);
// {
//   saveCount: 12,
//   saveErrorCount: 0,
//   totalBytesSaved: 14208,
//   lastSaveDurationMs: 3,
//   lastSaveAt: 1706140800000,
//   throttledCount: 8,
// }
```

## Storage backends

```typescript
import {
  createLocalStorageBackend,    // ~5MB limit, persists across sessions
  createIndexedDBBackend,       // ~50MB+, for large state
  createSessionStorageBackend,  // ~5MB limit, tab-scoped (gone on close)
  createMemoryStorageBackend,   // RAM only, for testing
} from '@statesync/persistence';

// IndexedDB for large data:
const storage = createIndexedDBBackend({
  dbName: 'my-app',
  storeName: 'state-cache',
  recordKey: 'dashboard-data',
});

// Session storage for temporary state:
const storage = createSessionStorageBackend({ key: 'wizard-progress' });
```

## Key points

1. **Load before sync** — `loadPersistedSnapshot` gives instant UI from cache while `sync.start()` fetches fresh data.

2. **Compression is transparent** — the persistence applier handles compress/decompress automatically. Your inner applier sees plain objects.

3. **Cross-tab sync avoids ping-pong** — receiving tab applies the snapshot but does not re-save it, preventing infinite broadcast loops.

4. **TTL prevents stale data** — expired cache is silently discarded on load.

5. **Throttling reduces I/O** — `debounceMs: 300` means rapid state changes result in a single save, not one per event.

## See also

- [@statesync/persistence](/packages/persistence) — full API reference
- [Persistence with migrations](/examples/persistence-migration) — schema versioning
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
