[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotProvider

# Function: createElectronSnapshotProvider()

```ts
function createElectronSnapshotProvider<T>(options): SnapshotProvider<T>;
```

Defined in: [transport.ts:48](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/transport.ts#L48)

Creates a SnapshotProvider that fetches snapshots via Electron IPC invoke.

Mirrors createTauriSnapshotProvider.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElectronSnapshotProviderOptions`](../interfaces/ElectronSnapshotProviderOptions.md) |

## Returns

`SnapshotProvider`\<`T`\>
