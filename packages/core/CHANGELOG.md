# state-sync

## 0.2.0

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

## 0.1.0

### Minor Changes

- Precise error phases: provider errors → `getSnapshot`, applier errors → `apply`.
  Non-recursive refresh queue (coalescing behavior preserved).
- Initial release: core engine, Pinia adapter, Tauri transport.
