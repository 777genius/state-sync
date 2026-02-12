[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / invalidationChannel

# Function: invalidationChannel()

```ts
function invalidationChannel(topic): string;
```

Defined in: [channels.ts:29](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/channels.ts#L29)

Returns the IPC channel name used to broadcast invalidation events for a given topic.

The main process sends InvalidationEvent payloads on this channel via
`webContents.send()`, and the renderer subscribes via `ipcRenderer.on()`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `topic` | `string` | The sync topic identifier (e.g. `"user-profile"`). |

## Returns

`string`

The fully-qualified IPC channel string in the format `statesync:<topic>:invalidated`.

## Example

```ts
invalidationChannel('user-profile');
// => 'statesync:user-profile:invalidated'
```
