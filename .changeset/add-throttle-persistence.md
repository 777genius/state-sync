---
"@statesync/core": minor
"@statesync/tauri": minor
"@statesync/persistence": minor
---

Add debounce/throttle support and enhanced persistence layer

## @statesync/core

- Add `throttling` option to `createRevisionSync()` for controlling refresh rate
- New `createThrottledHandler()` utility with debounce/throttle support
- Export `InvalidationThrottlingOptions` and `ThrottledHandler` types

## @statesync/persistence (enhanced)

### Core Features
- `createPersistenceApplier()` - wraps appliers with automatic state persistence
- `loadPersistedSnapshot()` - hydrates state from cache before sync starts
- `clearPersistedData()` - clears storage with cross-tab notification
- `createPersistenceApplierWithDefaults()` - factory with sensible defaults

### Storage Backends
- `createLocalStorageBackend()` - browser localStorage with quota handling
- `createIndexedDBBackend()` - IndexedDB for larger data
- `createSessionStorageBackend()` - temporary tab-scoped storage
- `createMemoryStorageBackend()` - in-memory for testing with latency/error simulation

### Advanced Features
- **Throttling**: `throttling.debounceMs`, `throttling.throttleMs`, `throttling.maxWaitMs`
- **Events**: `on('saveStart'|'saveComplete'|'saveError'|...)` for observability
- **Stats**: `getStats()` returns save counts, bytes saved, timing metrics
- **Schema Migration**: `migrateData()`, `createMigrationBuilder()` for versioned data
- **Cross-Tab Sync**: `createCrossTabSync()` using BroadcastChannel API
- **TTL**: Automatic cache expiration with `ttlMs` option
- **Integrity**: Optional hash verification with `enableHash`
- **Compression**: `createLZStringAdapter()`, `createBase64Adapter()` adapters

### New Types
- `PersistedSnapshotMetadata` - timestamp, schemaVersion, sizeBytes, hash, ttlMs
- `StorageBackendWithMetadata` - extended interface with metadata support
- `SaveThrottlingOptions` - debounce/throttle/leading/maxWait
- `PersistenceEvents` - event handler signatures
- `PersistenceStats` - runtime metrics
- `MigrationHandler`, `MigrationResult` - schema migration types
- `LoadOptions` - migration, validation, TTL bypass options

## @statesync/tauri

- Add `throttling` option to `createTauriRevisionSync()`
- New `createTauriFileBackend()` for file-based persistence via Tauri commands
