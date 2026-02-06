[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createMigrationBuilder

# Function: createMigrationBuilder()

```ts
function createMigrationBuilder<TFinal>(): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:116](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L116)

Builder for creating migration handlers with type safety.

## Type Parameters

| Type Parameter |
| ------ |
| `TFinal` |

## Returns

[`MigrationBuilder`](../interfaces/MigrationBuilder.md)\<`TFinal`\>

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
