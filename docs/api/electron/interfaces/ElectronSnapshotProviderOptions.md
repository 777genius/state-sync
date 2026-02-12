[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronSnapshotProviderOptions

# Interface: ElectronSnapshotProviderOptions

Defined in: [transport.ts:80](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L80)

Configuration options for [createElectronSnapshotProvider](../functions/createElectronSnapshotProvider.md).

## Properties

### channel

```ts
channel: string;
```

Defined in: [transport.ts:94](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L94)

The IPC channel name for snapshot requests.

Must match the channel registered by [createElectronSnapshotHandler](../functions/createElectronSnapshotHandler.md)
in the main process. Typically produced by [snapshotChannel](../functions/snapshotChannel.md)
(e.g. `"statesync:todos:snapshot"`).

***

### invoke

```ts
invoke: ElectronInvoke;
```

Defined in: [transport.ts:85](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L85)

The invoke function from the bridge (`bridge.invoke`) or any
[ElectronInvoke](../type-aliases/ElectronInvoke.md)-compatible function.
