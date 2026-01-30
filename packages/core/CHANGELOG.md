# state-sync

## 0.1.0

### Minor Changes

- Точные error phases: provider errors → `getSnapshot`, applier errors → `apply`.
  Non-recursive refresh queue (поведение coalescing сохранено).
- Initial release: core engine, Pinia adapter, Tauri transport.
