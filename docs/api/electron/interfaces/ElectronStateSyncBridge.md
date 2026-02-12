[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronStateSyncBridge

# Interface: ElectronStateSyncBridge

Defined in: [types.ts:116](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L116)

The bridge object exposed to the renderer via `contextBridge.exposeInMainWorld()`.

Created by [createElectronBridge](../functions/createElectronBridge.md) in the preload script and consumed by
renderer-side factories ([createElectronRevisionSync](../functions/createElectronRevisionSync.md),
[createElectronInvalidationSubscriber](../functions/createElectronInvalidationSubscriber.md), [createElectronSnapshotProvider](../functions/createElectronSnapshotProvider.md)).

**Security:** This bridge deliberately uses the unsubscribe-return pattern
for [on](#on) because `contextBridge` proxies break callback reference identity,
making `removeListener()` impossible from the renderer context.

**Process context:** Defined in preload, consumed in renderer.

## Example

```ts
// preload.ts
contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));

// renderer.ts
const bridge = (window as any).statesync as ElectronStateSyncBridge;
const sync = createElectronRevisionSync({ bridge, topic: 'todos', ... });
```

## Properties

### invoke

```ts
invoke: ElectronInvoke;
```

Defined in: [types.ts:129](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L129)

Invokes a main-process IPC handler on the given channel and returns the result.

#### See

[ElectronInvoke](../type-aliases/ElectronInvoke.md) for the full type signature.

***

### on

```ts
on: ElectronListen;
```

Defined in: [types.ts:122](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L122)

Subscribes to IPC events on the given channel and returns an unsubscribe function.

#### See

[ElectronListen](../type-aliases/ElectronListen.md) for the full type signature and rationale.
