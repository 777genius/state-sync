[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvalidationSubscriberOptions

# Interface: ElectronInvalidationSubscriberOptions

Defined in: [transport.ts:10](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/transport.ts#L10)

## Properties

### channel

```ts
channel: string;
```

Defined in: [transport.ts:14](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/transport.ts#L14)

IPC channel for invalidation events

***

### listen

```ts
listen: ElectronListen;
```

Defined in: [transport.ts:12](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/transport.ts#L12)

bridge.on or any ElectronListen-compatible function
