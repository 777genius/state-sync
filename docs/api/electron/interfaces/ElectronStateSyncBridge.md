[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronStateSyncBridge

# Interface: ElectronStateSyncBridge

Defined in: types.ts:36

The bridge object exposed via contextBridge.exposeInMainWorld.
Created by createElectronBridge() in preload.

Uses on() returning unsubscribe because contextBridge proxy identity is broken.

## Properties

### invoke

```ts
invoke: ElectronInvoke;
```

Defined in: types.ts:38

***

### on

```ts
on: ElectronListen;
```

Defined in: types.ts:37
