# @statesync/electron

Electron transport layer for [state-sync](https://github.com/777genius/state-sync) — IPC bridge, broadcaster, and snapshot handler for multi-window Electron apps.

## Installation

```bash
pnpm add @statesync/electron @statesync/core
```

## Quick Start

### Preload (2 lines of meaningful code)

```typescript
const { contextBridge, ipcRenderer } = require('electron');
const { createElectronBridge } = require('@statesync/electron');

contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
```

### TypeScript Setup

Declare the global bridge type in your renderer typings:

```typescript
// src/window.d.ts
import type { ElectronStateSyncBridge } from '@statesync/electron';

declare global {
  interface Window {
    statesync: ElectronStateSyncBridge;
  }
}

export {};
```

### Renderer

```typescript
import { createElectronRevisionSync } from '@statesync/electron';
import { createZustandSnapshotApplier } from '@statesync/zustand';

const sync = createElectronRevisionSync({
  topic: 'settings',
  bridge: window.statesync,
  applier: createZustandSnapshotApplier(useStore),
});
await sync.start();
```

### Main Process

```typescript
import { createElectronBroadcaster, createElectronSnapshotHandler } from '@statesync/electron';
import { ipcMain, BrowserWindow } from 'electron';

let state = { theme: 'dark', lang: 'en' };
let rev = 0;

const broadcaster = createElectronBroadcaster({
  topic: 'settings',
  getTargets: () => BrowserWindow.getAllWindows().map(w => w.webContents),
});

const handler = createElectronSnapshotHandler({
  topic: 'settings',
  getSnapshot: () => ({ revision: String(rev), data: state }),
  handle: ipcMain.handle.bind(ipcMain),
  removeHandler: ipcMain.removeHandler.bind(ipcMain),
});

// On state change:
function updateSettings(newState: typeof state) {
  state = newState;
  rev++;
  broadcaster.invalidate(String(rev));
}
```

## Why the Bridge Exists

`contextBridge` does **NOT** preserve callback identity. Each function crossing the bridge gets a new proxy. This means `ipcRenderer.removeListener(channel, callback)` is **broken** — the proxy at remove time differs from the proxy at add time.

`createElectronBridge` solves this by returning an unsubscribe closure from `on()`, which captures the exact listener reference in preload scope:

```javascript
// ❌ BROKEN — proxy identity not preserved
contextBridge.exposeInMainWorld('api', {
  on: (ch, cb) => ipcRenderer.on(ch, cb),
  removeListener: (ch, cb) => ipcRenderer.removeListener(ch, cb), // New proxy!
});

// ✅ WORKS — closure preserves listener reference
const bridge = createElectronBridge(ipcRenderer);
// bridge.on() returns () => void (unsubscribe)
```

See [electron/electron#33328](https://github.com/electron/electron/issues/33328) for details.

## API

### Preload

- `createElectronBridge(ipcRenderer)` — Creates bridge with correct unsubscribe behavior

### Renderer (Transport)

- `createElectronInvalidationSubscriber({ listen, channel })` — Low-level subscriber
- `createElectronSnapshotProvider({ invoke, channel })` — Low-level provider
- `createElectronRevisionSync({ topic, bridge, applier, ... })` — Convenience factory

### Main Process

- `createElectronBroadcaster({ topic, getTargets })` — Broadcasts invalidation events
- `createElectronSnapshotHandler({ topic, getSnapshot, handle, removeHandler })` — Handles snapshot requests

### Channel Convention

Default channels follow the pattern:
- Invalidation: `statesync:${topic}:invalidated`
- Snapshot: `statesync:${topic}:snapshot`

Override with `invalidationChannel` / `snapshotChannel` options.

## Testing

`electron` is an **optional** peer dependency. All functions accept structural types, so you can test without installing Electron:

```typescript
import { createElectronBridge } from '@statesync/electron';
import { vi } from 'vitest';

const mockIpcRenderer = {
  on: vi.fn((ch, cb) => mockIpcRenderer),
  removeListener: vi.fn((ch, cb) => mockIpcRenderer),
  invoke: vi.fn(async () => ({ revision: '1', data: {} })),
};

const bridge = createElectronBridge(mockIpcRenderer);
```

## License

MIT
