[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationFn

# Type Alias: MigrationFn()\<TOld, TNew\>

```ts
type MigrationFn<TOld, TNew> = (oldData) => TNew;
```

Defined in: [persistence/src/types.ts:179](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L179)

Migration function for upgrading persisted data.

## Type Parameters

| Type Parameter |
| ------ |
| `TOld` |
| `TNew` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `oldData` | `TOld` |

## Returns

`TNew`
