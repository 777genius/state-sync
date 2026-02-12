[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / needsMigration

# Function: needsMigration()

```ts
function needsMigration(fromVersion, currentVersion): boolean;
```

Defined in: [persistence/src/migration.ts:254](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L254)

Checks whether persisted data requires migration.

Returns `true` if the stored schema version is older than the current version.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fromVersion` | `number` | The schema version of the stored data. |
| `currentVersion` | `number` | The schema version the application currently expects. |

## Returns

`boolean`

`true` if `fromVersion < currentVersion`, indicating migration is needed.

## Example

```typescript
if (needsMigration(storedVersion, 3)) {
  const result = migrateData(data, storedVersion, migrationHandler);
}
```
