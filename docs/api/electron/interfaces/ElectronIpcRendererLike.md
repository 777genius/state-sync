[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcRendererLike

# Interface: ElectronIpcRendererLike

Defined in: [types.ts:30](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L30)

Structural type matching the subset of Electron's `ipcRenderer` API
required by [createElectronBridge](../functions/createElectronBridge.md).

Consumers can pass the real `ipcRenderer` from `'electron'` or any
compatible mock/stub for testing.

**Process context:** preload script (Node.js context with `contextIsolation`).

## Example

```ts
// In preload.ts
import { ipcRenderer } from 'electron';
import { createElectronBridge } from '@statesync/electron';

const bridge = createElectronBridge(ipcRenderer);
```

## Methods

### invoke()

```ts
invoke(channel, ...args): Promise<unknown>;
```

Defined in: [types.ts:58](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L58)

Sends an IPC message to the main process and asynchronously returns the response.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to invoke. |
| ...`args` | `unknown`[] | Optional arguments forwarded to the `ipcMain.handle()` handler. |

#### Returns

`Promise`\<`unknown`\>

A promise resolving to the value returned by the main-process handler.

***

### on()

```ts
on(channel, listener): unknown;
```

Defined in: [types.ts:40](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L40)

Registers a listener for messages on the given IPC channel.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to listen on. |
| `listener` | (`event`, ...`args`) => `void` | Callback invoked when a message arrives. The first argument is the Electron `IpcRendererEvent` (typed as `unknown` for structural compatibility), followed by any payload arguments sent from the main process. |

#### Returns

`unknown`

Implementation-defined (the return value is not used by state-sync).

***

### removeListener()

```ts
removeListener(channel, listener): unknown;
```

Defined in: [types.ts:49](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L49)

Removes a previously registered listener for the given IPC channel.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to stop listening on. |
| `listener` | (`event`, ...`args`) => `void` | The exact function reference originally passed to [on](#on). |

#### Returns

`unknown`

Implementation-defined (the return value is not used by state-sync).
