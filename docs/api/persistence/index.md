**@statesync/persistence**

***

# @statesync/persistence

## Interfaces

- [CompressionAdapter](interfaces/CompressionAdapter.md)
- [CrossTabSync](interfaces/CrossTabSync.md)
- [CrossTabSyncHandlers](interfaces/CrossTabSyncHandlers.md)
- [CrossTabSyncOptions](interfaces/CrossTabSyncOptions.md)
- [DisposablePersistenceApplier](interfaces/DisposablePersistenceApplier.md)
- [IndexedDBBackendOptions](interfaces/IndexedDBBackendOptions.md)
- [LoadOptions](interfaces/LoadOptions.md)
- [LocalStorageBackendOptions](interfaces/LocalStorageBackendOptions.md)
- [MemoryStorageBackendOptions](interfaces/MemoryStorageBackendOptions.md)
- [MigrationBuilder](interfaces/MigrationBuilder.md)
- [MigrationHandler](interfaces/MigrationHandler.md)
- [MigrationResult](interfaces/MigrationResult.md)
- [PersistedSnapshot](interfaces/PersistedSnapshot.md)
- [PersistedSnapshotMetadata](interfaces/PersistedSnapshotMetadata.md)
- [PersistenceApplierOptions](interfaces/PersistenceApplierOptions.md)
- [PersistenceErrorContext](interfaces/PersistenceErrorContext.md)
- [PersistenceEvents](interfaces/PersistenceEvents.md)
- [PersistenceStats](interfaces/PersistenceStats.md)
- [SaveThrottlingOptions](interfaces/SaveThrottlingOptions.md)
- [SessionStorageBackendOptions](interfaces/SessionStorageBackendOptions.md)
- [StorageBackend](interfaces/StorageBackend.md)
- [StorageBackendWithMetadata](interfaces/StorageBackendWithMetadata.md)
- [StorageUsage](interfaces/StorageUsage.md)

## Type Aliases

- [CrossTabMessage](type-aliases/CrossTabMessage.md)
- [MigrationFn](type-aliases/MigrationFn.md)

## Functions

- [benchmarkCompression](functions/benchmarkCompression.md)
- [clearPersistedData](functions/clearPersistedData.md)
- [createBase64Adapter](functions/createBase64Adapter.md)
- [createCompressionAdapter](functions/createCompressionAdapter.md)
- [createCrossTabSync](functions/createCrossTabSync.md)
- [createIndexedDBBackend](functions/createIndexedDBBackend.md)
- [createLocalStorageBackend](functions/createLocalStorageBackend.md)
- [createLZCompressionAdapter](functions/createLZCompressionAdapter.md)
- [createLZStringAdapter](functions/createLZStringAdapter.md)
- [createMemoryStorageBackend](functions/createMemoryStorageBackend.md)
- [createMigrationBuilder](functions/createMigrationBuilder.md)
- [createNoCompressionAdapter](functions/createNoCompressionAdapter.md)
- [createPersistenceApplier](functions/createPersistenceApplier.md)
- [createPersistenceApplierWithDefaults](functions/createPersistenceApplierWithDefaults.md)
- [createSessionStorageBackend](functions/createSessionStorageBackend.md)
- [createSharedMemoryStorage](functions/createSharedMemoryStorage.md)
- [createSimpleMigration](functions/createSimpleMigration.md)
- [estimateCompressionRatio](functions/estimateCompressionRatio.md)
- [getMigrationPath](functions/getMigrationPath.md)
- [isBroadcastChannelSupported](functions/isBroadcastChannelSupported.md)
- [loadPersistedSnapshot](functions/loadPersistedSnapshot.md)
- [lzCompress](functions/lzCompress.md)
- [lzDecompress](functions/lzDecompress.md)
- [migrateData](functions/migrateData.md)
- [needsMigration](functions/needsMigration.md)
- [withCrossTabSync](functions/withCrossTabSync.md)
