[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotProvider

# Function: createElectronSnapshotProvider()

```ts
function createElectronSnapshotProvider<T>(options): SnapshotProvider<T>;
```

Defined in: transport.ts:48

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
