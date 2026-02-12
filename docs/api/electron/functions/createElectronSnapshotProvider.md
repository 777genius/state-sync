[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotProvider

# Function: createElectronSnapshotProvider()

```ts
function createElectronSnapshotProvider<T>(options): SnapshotProvider<T>;
```

Defined in: [transport.ts:125](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/transport.ts#L125)

Creates a SnapshotProvider that fetches snapshots from the main process
via Electron IPC `invoke`.

When SnapshotProvider.getSnapshot is called, it sends an
`ipcRenderer.invoke()` request to the main process on the configured channel
and returns the resulting SnapshotEnvelope.

Mirrors `createTauriSnapshotProvider` in the `@statesync/tauri` package.

**Process context:** renderer process.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ElectronSnapshotProviderOptions`](../interfaces/ElectronSnapshotProviderOptions.md) | Configuration specifying the invoke function and IPC channel. |

## Returns

`SnapshotProvider`\<`T`\>

A SnapshotProvider compatible with the core engine's
  RevisionSyncOptions.provider option.

## Example

```ts
const provider = createElectronSnapshotProvider<TodoList>({
  invoke: bridge.invoke,
  channel: 'statesync:todos:snapshot',
});

const envelope = await provider.getSnapshot();
console.log(envelope.revision, envelope.data);
```
