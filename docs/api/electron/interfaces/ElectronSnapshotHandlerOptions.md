[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronSnapshotHandlerOptions

# Interface: ElectronSnapshotHandlerOptions\<T\>

Defined in: [main.ts:145](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L145)

Configuration options for [createElectronSnapshotHandler](../functions/createElectronSnapshotHandler.md).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: [main.ts:183](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L183)

Override the default IPC channel name for snapshot requests.

Defaults to `statesync:<topic>:snapshot` (produced by [snapshotChannel](../functions/snapshotChannel.md)).

***

### getSnapshot()

```ts
getSnapshot: () => SnapshotEnvelope<T> | Promise<SnapshotEnvelope<T>>;
```

Defined in: [main.ts:158](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L158)

Returns the current snapshot envelope for the given topic.

This callback may be invoked concurrently from multiple renderer windows
(each renderer calls `ipcRenderer.invoke()` independently). Implementations
must be safe for concurrent invocations and should avoid side effects.

#### Returns

`SnapshotEnvelope`\<`T`\> \| `Promise`\<`SnapshotEnvelope`\<`T`\>\>

The current snapshot, synchronously or as a promise.

***

### handle

```ts
handle: ElectronIpcMainHandle;
```

Defined in: [main.ts:167](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L167)

The `ipcMain.handle` function (or a compatible mock).

Used to register the snapshot request handler on the IPC channel.

#### See

[ElectronIpcMainHandle](../type-aliases/ElectronIpcMainHandle.md)

***

### removeHandler

```ts
removeHandler: ElectronIpcMainRemoveHandler;
```

Defined in: [main.ts:176](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L176)

The `ipcMain.removeHandler` function (or a compatible mock).

Used by [ElectronSnapshotHandlerHandle.dispose](ElectronSnapshotHandlerHandle.md#dispose) to unregister the handler.

#### See

[ElectronIpcMainRemoveHandler](../type-aliases/ElectronIpcMainRemoveHandler.md)

***

### topic

```ts
topic: string;
```

Defined in: [main.ts:147](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L147)

The sync topic identifier (e.g. `"user-profile"`).
