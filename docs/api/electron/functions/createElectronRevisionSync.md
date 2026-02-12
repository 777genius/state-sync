[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronRevisionSync

# Function: createElectronRevisionSync()

```ts
function createElectronRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: [sync.ts:132](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L132)

Convenience factory that wires the Electron bridge, transport layer, and core
revision-sync engine into a single RevisionSyncHandle.

This is pure DX sugar — it does not add new protocol semantics beyond what
the core engine provides. Internally it decomposes the bridge into separate
`listen` and `invoke` functions for the transport layer.

Mirrors `createTauriRevisionSync` in the `@statesync/tauri` package.

**Process context:** renderer process.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CreateElectronRevisionSyncOptions`](../interfaces/CreateElectronRevisionSyncOptions.md)\<`T`\> | Configuration including the bridge, topic, applier, and optional overrides. |

## Returns

`RevisionSyncHandle`

A RevisionSyncHandle with `start()`, `stop()`, `refresh()`,
  and `getLocalRevision()` methods.

## Example

```ts
import type { ElectronStateSyncBridge } from '@statesync/electron';
import { createElectronRevisionSync } from '@statesync/electron';

const bridge = (window as any).statesync as ElectronStateSyncBridge;

const sync = createElectronRevisionSync<TodoList>({
  topic: 'todos',
  bridge,
  applier: {
    apply(snapshot) {
      todoStore.setState(snapshot.data);
    },
  },
});

await sync.start();
// ... later
sync.stop();
```
