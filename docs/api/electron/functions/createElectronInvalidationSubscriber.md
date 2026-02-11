[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronInvalidationSubscriber

# Function: createElectronInvalidationSubscriber()

```ts
function createElectronInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:23](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/transport.ts#L23)

Creates an InvalidationSubscriber using Electron IPC.

Mirrors createTauriInvalidationSubscriber.
Transport is thin — just forwards payloads. Engine validates topic/revision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElectronInvalidationSubscriberOptions`](../interfaces/ElectronInvalidationSubscriberOptions.md) |

## Returns

`InvalidationSubscriber`
