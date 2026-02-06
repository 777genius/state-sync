[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationFn

# Type Alias: MigrationFn()\<TOld, TNew\>

```ts
type MigrationFn<TOld, TNew> = (oldData) => TNew;
```

Defined in: [persistence/src/types.ts:179](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L179)

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
