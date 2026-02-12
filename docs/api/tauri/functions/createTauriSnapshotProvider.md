[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriSnapshotProvider

# Function: createTauriSnapshotProvider()

```ts
function createTauriSnapshotProvider<T>(options): SnapshotProvider<T>;
```

Defined in: [transport.ts:210](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/transport.ts#L210)

Creates a SnapshotProvider that fetches snapshots by invoking a Tauri command.

Each call to `getSnapshot()` invokes the specified Rust command and expects
a SnapshotEnvelope in return. The command receives any extra `args`
provided in the options.

**Rust backend requirement:** The command must return a JSON-serializable
struct with `{ revision: String, data: T }`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`TauriSnapshotProviderOptions`](../interfaces/TauriSnapshotProviderOptions.md) | Configuration specifying the `invoke` function, command name, and optional args. |

## Returns

`SnapshotProvider`\<`T`\>

A SnapshotProvider that can be passed to `createRevisionSync`.

## Example

```typescript
import { invoke } from '@tauri-apps/api/core';

interface AppState {
  counters: Record<string, number>;
}

const provider = createTauriSnapshotProvider<AppState>({
  invoke,
  commandName: 'get_app_state',
  args: { workspaceId: 'ws_abc123' },
});

const envelope = await provider.getSnapshot();
console.log(envelope.revision, envelope.data.counters);
```
