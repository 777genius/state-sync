# @statesync/electron

## 1.0.0

### Major Changes

- Initial release
- `createElectronBridge` — preload bridge solving contextBridge callback identity issue
- `createElectronInvalidationSubscriber` / `createElectronSnapshotProvider` — low-level transport
- `createElectronRevisionSync` — convenience factory wiring bridge → transport → core engine
- `createElectronBroadcaster` / `createElectronSnapshotHandler` — main process helpers
