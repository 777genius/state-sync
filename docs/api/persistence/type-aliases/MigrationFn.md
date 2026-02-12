[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationFn

# Type Alias: MigrationFn()\<TOld, TNew\>

```ts
type MigrationFn<TOld, TNew> = (oldData) => TNew;
```

Defined in: [persistence/src/types.ts:321](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L321)

A pure function that transforms persisted data from one schema version to the next.

Migration functions are applied sequentially -- e.g., `v1 -> v2 -> v3` --
so each function only needs to handle a single version step.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TOld` | The shape of the data in the source schema version. |
| `TNew` | The shape of the data in the target schema version. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldData` | `TOld` | The data in the source format. |

## Returns

`TNew`

The transformed data in the target format.
