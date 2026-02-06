[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationBuilder

# Interface: MigrationBuilder\<TFinal\>

Defined in: [persistence/src/migration.ts:147](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L147)

Migration builder interface.

## Type Parameters

| Type Parameter |
| ------ |
| `TFinal` |

## Methods

### addMigration()

```ts
addMigration<TFrom, TTo>(fromVersion, fn): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:151](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L151)

Add a migration from one version to the next.

#### Type Parameters

| Type Parameter |
| ------ |
| `TFrom` |
| `TTo` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fromVersion` | `number` |
| `fn` | [`MigrationFn`](../type-aliases/MigrationFn.md)\<`TFrom`, `TTo`\> |

#### Returns

`MigrationBuilder`\<`TFinal`\>

***

### build()

```ts
build(currentVersion): MigrationHandler<TFinal>;
```

Defined in: [persistence/src/migration.ts:164](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L164)

Build the migration handler.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `currentVersion` | `number` |

#### Returns

[`MigrationHandler`](MigrationHandler.md)\<`TFinal`\>

***

### withValidator()

```ts
withValidator(fn): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:159](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/migration.ts#L159)

Add a validator for the final data type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | (`data`) => `data is TFinal` |

#### Returns

`MigrationBuilder`\<`TFinal`\>
