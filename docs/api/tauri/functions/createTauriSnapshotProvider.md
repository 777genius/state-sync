[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriSnapshotProvider

# Function: createTauriSnapshotProvider()

```ts
function createTauriSnapshotProvider<T>(options): SnapshotProvider<T>;
```

Defined in: [transport.ts:66](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/tauri/src/transport.ts#L66)

Creates a SnapshotProvider that fetches snapshots via Tauri `invoke`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TauriSnapshotProviderOptions`](../interfaces/TauriSnapshotProviderOptions.md) |

## Returns

`SnapshotProvider`\<`T`\>
