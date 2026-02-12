/**
 * @statesync/persistence
 *
 * Persistence layer for state-sync. Provides automatic snapshot caching to
 * localStorage, sessionStorage, IndexedDB, or custom backends with support
 * for throttling/debouncing, LZ compression, schema migration, TTL expiration,
 * integrity hashing, and cross-tab synchronization via BroadcastChannel.
 *
 * @packageDocumentation
 */

// Compression
export {
  benchmarkCompression,
  createBase64Adapter,
  createCompressionAdapter,
  createLZCompressionAdapter,
  createLZStringAdapter,
  createNoCompressionAdapter,
  estimateCompressionRatio,
  lzCompress,
  lzDecompress,
} from './compression';
// Cross-tab sync
export {
  type CrossTabMessage,
  type CrossTabSync,
  type CrossTabSyncHandlers,
  createCrossTabSync,
  isBroadcastChannelSupported,
  withCrossTabSync,
} from './cross-tab';
// Migration
export {
  createMigrationBuilder,
  createSimpleMigration,
  getMigrationPath,
  type MigrationBuilder,
  migrateData,
  needsMigration,
} from './migration';
export {
  clearPersistedData,
  createPersistenceApplier,
  createPersistenceApplierWithDefaults,
  loadPersistedSnapshot,
} from './persistence-applier';
// Storage backends
export { createIndexedDBBackend, type IndexedDBBackendOptions } from './storage/indexed-db';
export {
  createLocalStorageBackend,
  type LocalStorageBackendOptions,
} from './storage/local-storage';
export {
  createMemoryStorageBackend,
  createSharedMemoryStorage,
  type MemoryStorageBackendOptions,
} from './storage/memory-storage';
export {
  createSessionStorageBackend,
  type SessionStorageBackendOptions,
} from './storage/session-storage';

// Types
export type {
  CompressionAdapter,
  CrossTabSyncOptions,
  DisposablePersistenceApplier,
  LoadOptions,
  MigrationFn,
  MigrationHandler,
  MigrationResult,
  PersistedSnapshot,
  PersistedSnapshotMetadata,
  PersistenceApplierOptions,
  PersistenceErrorContext,
  PersistenceEvents,
  PersistenceStats,
  SaveThrottlingOptions,
  StorageBackend,
  StorageBackendWithMetadata,
  StorageUsage,
} from './types';
