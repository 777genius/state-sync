[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronInvalidationSubscriber

# Function: createElectronInvalidationSubscriber()

```ts
function createElectronInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:23](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/transport.ts#L23)

Creates an InvalidationSubscriber using Electron IPC.

Mirrors createTauriInvalidationSubscriber.
Transport is thin — just forwards payloads. Engine validates topic/revision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElectronInvalidationSubscriberOptions`](../interfaces/ElectronInvalidationSubscriberOptions.md) |

## Returns

`InvalidationSubscriber`
