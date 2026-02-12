[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / migrateData

# Function: migrateData()

```ts
function migrateData<T>(
   data, 
   fromVersion, 
handler): MigrationResult<T>;
```

Defined in: [persistence/src/migration.ts:40](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L40)

Migrate data from one schema version to another by applying migration
functions sequentially.

Migrations are applied in order from `fromVersion` up to (but not including)
`handler.currentVersion`. For example, migrating from v1 to v3 applies
`migrations[1]` then `migrations[2]`.

If `fromVersion` equals `currentVersion`, no migrations are applied and
the data is optionally validated. If `fromVersion` is greater than
`currentVersion`, the migration fails (data from a future version).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state in the target (current) schema version. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The raw persisted data to migrate. Type is `unknown` because the source schema may differ from the current one. |
| `fromVersion` | `number` | The schema version of the stored data. |
| `handler` | [`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\> | The migration handler containing the target version, migration functions, and optional validator. |

## Returns

[`MigrationResult`](../interfaces/MigrationResult.md)\<`T`\>

A [MigrationResult](../interfaces/MigrationResult.md) indicating success or failure, with the
  migrated data on success or an error on failure.

## Example

```typescript
const migration: MigrationHandler<AppState> = {
  currentVersion: 3,
  migrations: {
    1: (v1) => ({ ...v1, newField: 'default' }), // v1 -> v2
    2: (v2) => ({ ...v2, renamedField: v2.oldField }), // v2 -> v3
  },
};

const result = migrateData(oldData, 1, migration);
if (result.success) {
  console.log('Migrated to:', result.data);
}
```
