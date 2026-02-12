[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / snapshotChannel

# Function: snapshotChannel()

```ts
function snapshotChannel(topic): string;
```

Defined in: [channels.ts:49](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/channels.ts#L49)

Returns the IPC channel name used for snapshot request/response for a given topic.

The main process registers an `ipcMain.handle()` listener on this channel,
and the renderer invokes it via `ipcRenderer.invoke()` to fetch the current
SnapshotEnvelope.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `topic` | `string` | The sync topic identifier (e.g. `"user-profile"`). |

## Returns

`string`

The fully-qualified IPC channel string in the format `statesync:<topic>:snapshot`.

## Example

```ts
snapshotChannel('user-profile');
// => 'statesync:user-profile:snapshot'
```
