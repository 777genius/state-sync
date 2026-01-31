# state-sync

## 0.1.0

### Minor Changes

- Precise error phases: provider errors → `getSnapshot`, applier errors → `apply`.
  Non-recursive refresh queue (coalescing behavior preserved).
- Initial release: core engine, Pinia adapter, Tauri transport.
