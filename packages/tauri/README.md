# state-sync-tauri

Tauri transport for state-sync. Uses Tauri events for invalidation and `invoke` for snapshots.

## Install

```bash
npm install state-sync-tauri state-sync
```

## Quick Start

```typescript
import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  createTauriRevisionSync,
} from 'state-sync-tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

// Option A: explicit wiring
const handleA = createRevisionSync({
  topic: 'settings',
  subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:invalidation' }),
  provider: createTauriSnapshotProvider({ invoke, commandName: 'get_snapshot', args: { topic: 'settings' } }),
  applier: myApplier,
});

// Option B: DX sugar
const handleB = createTauriRevisionSync({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_snapshot',
  args: { topic: 'settings' },
  applier: myApplier,
});

await handleA.start();
await handleB.start();
```

## API

### `createTauriInvalidationSubscriber(options)`

Wraps Tauri `listen` into an `InvalidationSubscriber`.

### `createTauriSnapshotProvider<T>(options)`

Wraps Tauri `invoke` into a `SnapshotProvider<T>`.

Both adapters accept structural types — you can pass your own mocks for testing without a Tauri runtime.

## Peer dependency policy

`@tauri-apps/api` is declared as an **optional** peer dependency:

- **In a production Tauri app**: install `@tauri-apps/api >=2` — you pass `listen` and `invoke` directly.
- **In tests**: you **don’t need** to install `@tauri-apps/api`. Use structural mocks:

```typescript
import { createRevisionSync } from 'state-sync';
import { createTauriInvalidationSubscriber, createTauriSnapshotProvider } from 'state-sync-tauri';

const mockListen = async (eventName, handler) => {
  // emulate events
  return () => {};
};

const mockInvoke = async (cmd, args) => {
  return { revision: '1', data: { /* ... */ } };
};

const subscriber = createTauriInvalidationSubscriber({ listen: mockListen, eventName: 'evt' });
const provider = createTauriSnapshotProvider({ invoke: mockInvoke, commandName: 'cmd' });
```

The adapters are typed via structural types (`TauriListen`, `TauriInvoke`), so any function with a compatible signature will be accepted by the TypeScript compiler.
