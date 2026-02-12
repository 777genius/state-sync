[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSimpleMigration

# Function: createSimpleMigration()

```ts
function createSimpleMigration<T>(config): MigrationHandler<T>;
```

Defined in: [persistence/src/migration.ts:230](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L230)

Creates a [MigrationHandler](../interfaces/MigrationHandler.md) directly from a plain configuration object,
without using the builder pattern.

This is a convenience function for simple cases where the builder's fluent
API is unnecessary.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state in the current schema version. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `Omit`\<[`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\>, `"validate"`\> & `object` | The migration configuration including `currentVersion`, `migrations` record, and an optional `validate` type-guard. |

## Returns

[`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\>

A migration handler ready to be used with [loadPersistedSnapshot](loadPersistedSnapshot.md)
  or [migrateData](migrateData.md).

## Example

```typescript
const migration = createSimpleMigration<AppState>({
  currentVersion: 2,
  migrations: {
    1: (old) => ({ ...old, newField: 'default' }),
  },
});
```
