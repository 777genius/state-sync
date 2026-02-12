[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvalidationSubscriberOptions

# Interface: ElectronInvalidationSubscriberOptions

Defined in: [transport.ts:25](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L25)

Configuration options for [createElectronInvalidationSubscriber](../functions/createElectronInvalidationSubscriber.md).

## Properties

### channel

```ts
channel: string;
```

Defined in: [transport.ts:37](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L37)

The IPC channel name to subscribe to for invalidation events.

Typically produced by [invalidationChannel](../functions/invalidationChannel.md) (e.g. `"statesync:todos:invalidated"`).

***

### listen

```ts
listen: ElectronListen;
```

Defined in: [transport.ts:30](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L30)

The listen function from the bridge (`bridge.on`) or any
[ElectronListen](../type-aliases/ElectronListen.md)-compatible function.
