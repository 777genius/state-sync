[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / getMigrationPath

# Function: getMigrationPath()

```ts
function getMigrationPath(fromVersion, toVersion): number[];
```

Defined in: [persistence/src/migration.ts:278](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/migration.ts#L278)

Computes the ordered list of version numbers that must be migrated through
to get from one schema version to another.

Each number in the returned array represents a migration step: version `N`
means "apply `migrations[N]`" to go from version N to N+1.

Returns an empty array if `fromVersion >= toVersion` (no migration needed).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fromVersion` | `number` | The starting schema version. |
| `toVersion` | `number` | The target schema version. |

## Returns

`number`[]

An array of version numbers, e.g., `[1, 2]` to go from v1 to v3.

## Example

```typescript
getMigrationPath(1, 4); // [1, 2, 3]
getMigrationPath(3, 3); // []
getMigrationPath(5, 3); // []
```
