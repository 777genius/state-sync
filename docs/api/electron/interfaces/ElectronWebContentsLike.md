[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronWebContentsLike

# Interface: ElectronWebContentsLike

Defined in: [types.ts:147](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L147)

Structural type matching a subset of Electron's `WebContents` API
used by the main-process broadcaster to send invalidation events to renderers.

Consumers can pass real `webContents` instances from `BrowserWindow.webContents`
or any compatible mock/stub for testing.

**Process context:** main process only.

## Example

```ts
const targets: ElectronWebContentsLike[] = BrowserWindow.getAllWindows()
  .map(w => w.webContents);
```

## Methods

### isDestroyed()

```ts
isDestroyed(): boolean;
```

Defined in: [types.ts:154](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L154)

Returns `true` if the underlying native web contents has been destroyed.
Used as a guard before calling [send](#send) to avoid runtime errors.

#### Returns

`boolean`

Whether the web contents instance has been destroyed.

***

### send()

```ts
send(channel, ...args): void;
```

Defined in: [types.ts:163](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L163)

Sends an asynchronous IPC message to the renderer process associated
with this web contents instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name. |
| ...`args` | `unknown`[] | Payload arguments to send along with the message. |

#### Returns

`void`
