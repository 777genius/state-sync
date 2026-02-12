[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvalidationSubscriberOptions

# Interface: ElectronInvalidationSubscriberOptions

Defined in: [transport.ts:25](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/transport.ts#L25)

Configuration options for [createElectronInvalidationSubscriber](../functions/createElectronInvalidationSubscriber.md).

## Properties

### channel

```ts
channel: string;
```

Defined in: [transport.ts:37](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/transport.ts#L37)

The IPC channel name to subscribe to for invalidation events.

Typically produced by [invalidationChannel](../functions/invalidationChannel.md) (e.g. `"statesync:todos:invalidated"`).

***

### listen

```ts
listen: ElectronListen;
```

Defined in: [transport.ts:30](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/transport.ts#L30)

The listen function from the bridge (`bridge.on`) or any
[ElectronListen](../type-aliases/ElectronListen.md)-compatible function.
