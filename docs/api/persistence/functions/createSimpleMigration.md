[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSimpleMigration

# Function: createSimpleMigration()

```ts
function createSimpleMigration<T>(config): MigrationHandler<T>;
```

Defined in: [persistence/src/migration.ts:180](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/migration.ts#L180)

Create a simple migration handler without the builder pattern.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `Omit`\<[`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\>, `"validate"`\> & `object` |

## Returns

[`MigrationHandler`](../interfaces/MigrationHandler.md)\<`T`\>

## Example

```typescript
const migration = createSimpleMigration<AppState>({
  currentVersion: 2,
  migrations: {
    1: (old) => ({ ...old, newField: 'default' }),
  },
});
```
