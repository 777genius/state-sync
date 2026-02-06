# @statesync/persistence

## 1.0.0

### Minor Changes

- Add debounce/throttle support and persistence layer

  ## @statesync/core

  - Add `throttling` option to `createRevisionSync()` for controlling refresh rate
  - New `createThrottledHandler()` utility with debounce/throttle support
  - Export `InvalidationThrottlingOptions` and `ThrottledHandler` types

  ## @statesync/persistence (new package)

  - `createPersistenceApplier()` - wraps appliers with automatic state persistence
  - `loadPersistedSnapshot()` - hydrates state from cache before sync starts
  - `createLocalStorageBackend()` - browser localStorage storage
  - `createIndexedDBBackend()` - IndexedDB storage for larger data
  - Debounce support for save operations
  - Revision validation on load

  ## @statesync/tauri

  - Add `throttling` option to `createTauriRevisionSync()`
  - New `createTauriFileBackend()` for file-based persistence via Tauri commands

### Patch Changes

- Updated dependencies
  - @statesync/core@0.2.0
