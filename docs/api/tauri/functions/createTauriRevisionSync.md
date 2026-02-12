[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriRevisionSync

# Function: createTauriRevisionSync()

```ts
function createTauriRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: [sync.ts:187](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/sync.ts#L187)

One-call convenience factory that wires Tauri transport and the core
revision-sync engine together into a single RevisionSyncHandle.

Under the hood it creates a [TauriInvalidationSubscriber](createTauriInvalidationSubscriber.md)
and a [TauriSnapshotProvider](createTauriSnapshotProvider.md), then passes them
along with the remaining options to `createRevisionSync` from `@statesync/core`.

This function is pure DX sugar; it does not introduce any new protocol
semantics beyond what the core engine already provides.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CreateTauriRevisionSyncOptions`](../interfaces/CreateTauriRevisionSyncOptions.md)\<`T`\> | Combined Tauri transport and core engine options. |

## Returns

`RevisionSyncHandle`

A RevisionSyncHandle that can be started, stopped, and manually refreshed.

## Example

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { createTauriRevisionSync } from '@statesync/tauri';

interface AppSettings {
  theme: 'light' | 'dark';
  locale: string;
}

const sync = createTauriRevisionSync<AppSettings>({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'settings-changed',
  commandName: 'get_settings',
  applier: {
    apply(snapshot) {
      settingsStore.set(snapshot.data);
    },
  },
  throttling: { debounceMs: 200 },
  logger: console,
  onError: (ctx) => console.error('Sync error', ctx),
});

// Start listening and fetch the initial snapshot:
await sync.start();

// Later, tear down:
sync.stop();
```
