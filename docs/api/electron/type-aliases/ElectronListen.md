[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronListen

# Type Alias: ElectronListen()

```ts
type ElectronListen = (channel, handler) => () => void;
```

Defined in: [types.ts:79](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L79)

Function signature for subscribing to IPC events from the renderer process,
returning a synchronous unsubscribe callback.

The unsubscribe-return pattern solves a fundamental Electron limitation:
`contextBridge` does not preserve callback identity across the bridge boundary,
making `ipcRenderer.removeListener()` unusable from the renderer. By capturing
the original listener reference in the preload closure, the returned unsubscribe
function can correctly remove it.

This is the Electron analog of `TauriListen`, but returns synchronously
(Electron's `ipcRenderer.on` is synchronous, unlike Tauri's `listen` which is async).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to listen on. |
| `handler` | (...`args`) => `void` | Callback invoked with the message payload arguments (the Electron event object is stripped by the bridge). |

## Returns

A teardown function that removes the listener. Safe to call multiple times.

```ts
(): void;
```

### Returns

`void`
