[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createMigrationBuilder

# Function: createMigrationBuilder()

```ts
function createMigrationBuilder<TFinal>(): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:139](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L139)

Creates a fluent builder for constructing [MigrationHandler](../interfaces/MigrationHandler.md) instances
with full type safety across migration steps.

The builder pattern ensures each migration step is explicitly typed,
making it harder to introduce schema mismatches.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TFinal` | The shape of the application state in the final (current) schema version. |

## Returns

[`MigrationBuilder`](../interfaces/MigrationBuilder.md)\<`TFinal`\>

A new [MigrationBuilder](../interfaces/MigrationBuilder.md) instance with no migrations registered.

## Example

```typescript
interface AppStateV1 { count: number }
interface AppStateV2 { count: number; name: string }
interface AppStateV3 { count: number; name: string; enabled: boolean }

const migration = createMigrationBuilder<AppStateV3>()
  .addMigration<AppStateV1, AppStateV2>(1, (v1) => ({ ...v1, name: 'default' }))
  .addMigration<AppStateV2, AppStateV3>(2, (v2) => ({ ...v2, enabled: true }))
  .build(3);
```
