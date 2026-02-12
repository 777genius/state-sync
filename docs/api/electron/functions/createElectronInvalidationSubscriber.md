[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronInvalidationSubscriber

# Function: createElectronInvalidationSubscriber()

```ts
function createElectronInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:64](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/transport.ts#L64)

Creates an InvalidationSubscriber that listens for invalidation events
over Electron IPC.

This transport is intentionally thin — it simply forwards raw IPC payloads
as InvalidationEvent objects. The core engine is responsible for
validating `topic` and `revision` at runtime.

Mirrors `createTauriInvalidationSubscriber` in the `@statesync/tauri` package.

**Process context:** renderer process.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ElectronInvalidationSubscriberOptions`](../interfaces/ElectronInvalidationSubscriberOptions.md) | Configuration specifying the listen function and IPC channel. |

## Returns

`InvalidationSubscriber`

An InvalidationSubscriber compatible with the core engine's
  RevisionSyncOptions.subscriber option.

## Example

```ts
const subscriber = createElectronInvalidationSubscriber({
  listen: bridge.on,
  channel: 'statesync:todos:invalidated',
});
```
