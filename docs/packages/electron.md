---
title: Electron (@statesync/electron)
---

# @statesync/electron

Transport adapter for Electron applications.

## Installation

```bash
npm install @statesync/electron @statesync/core
```

## Why the bridge?

Electron's `contextBridge` does **not** preserve callback identity. Each function crossing the bridge gets a new proxy, which breaks `ipcRenderer.removeListener()` because the callback reference differs.

`createElectronBridge()` solves this by returning an unsubscribe closure from `on()`, which captures the exact listener reference in preload scope.

## Quick start

### 1. Preload script

```typescript
// preload.ts
const { contextBridge, ipcRenderer } = require('electron');
const { createElectronBridge } = require('@statesync/electron');

contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
```

### TypeScript setup

Declare the global bridge type in your renderer:

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

### 2. Main process

```typescript
// main.ts
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

### 3. Renderer

```typescript
// renderer.ts
import { createElectronRevisionSync } from '@statesync/electron';

const sync = createElectronRevisionSync({
  topic: 'settings',
  bridge: window.statesync,
  applier: {
    apply(snapshot) {
      console.log('New state:', snapshot.data);
    },
  },
});
await sync.start();
```

## API

### High-level (DX sugar)

- `createElectronRevisionSync(options)` — ready-made wiring of bridge + transport + core engine

### Low-level (building blocks)

- `createElectronBridge(ipcRenderer)` — creates the preload bridge object
- `createElectronBroadcaster(options)` — broadcasts invalidation events to webContents
- `createElectronSnapshotHandler(options)` — registers `ipcMain.handle()` for snapshot requests
- `createElectronInvalidationSubscriber(options)` — creates subscriber from bridge events
- `createElectronSnapshotProvider(options)` — creates provider from bridge invoke

### Channel helpers

- `invalidationChannel(topic)` — returns `statesync:${topic}:invalidated`
- `snapshotChannel(topic)` — returns `statesync:${topic}:snapshot`

## Options reference

### createElectronRevisionSync

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `topic` | `string` | Yes | Topic identifier |
| `bridge` | `ElectronStateSyncBridge` | Yes | Bridge object from `window.statesync` |
| `applier` | `SnapshotApplier` | Yes | Applier to update local state |
| `invalidationChannel` | `string` | No | Override default channel |
| `snapshotChannel` | `string` | No | Override default channel |
| `shouldRefresh` | `(event: InvalidationEvent) => boolean` | No | Filter invalidation events |
| `throttling` | `InvalidationThrottlingOptions` | No | Control refresh rate |
| `onError` | `(ctx: SyncErrorContext) => void` | No | Error callback with phase context |
| `logger` | `Logger` | No | Logger instance |

## Full API reference

See the [generated TypeDoc API](/api/electron/) for complete type signatures.

## Peer dependencies

`electron` is declared as an optional peer dependency. This allows tests to run without Electron installed.
