[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronStateSyncBridge

# Interface: ElectronStateSyncBridge

Defined in: [types.ts:36](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L36)

The bridge object exposed via contextBridge.exposeInMainWorld.
Created by createElectronBridge() in preload.

Uses on() returning unsubscribe because contextBridge proxy identity is broken.

## Properties

### invoke

```ts
invoke: ElectronInvoke;
```

Defined in: [types.ts:38](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L38)

***

### on

```ts
on: ElectronListen;
```

Defined in: [types.ts:37](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L37)
