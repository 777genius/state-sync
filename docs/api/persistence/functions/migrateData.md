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

Defined in: [persistence/src/migration.ts:24](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L24)

Migrate data from one schema version to another.

Applies migrations sequentially from fromVersion to currentVersion.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |
| `fromVersion` | `number` |
| `handler` | [`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\> |

## Returns

[`MigrationResult`](../interfaces/MigrationResult.md)\<`T`\>

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
