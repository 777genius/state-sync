[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationBuilder

# Interface: MigrationBuilder\<TFinal\>

Defined in: [persistence/src/migration.ts:175](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L175)

Fluent builder interface for constructing a [MigrationHandler](MigrationHandler.md).

Created via [createMigrationBuilder](../functions/createMigrationBuilder.md). Allows chaining migration
steps and an optional validator before producing the final handler.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TFinal` | The shape of the application state in the final (current) schema version. |

## Methods

### addMigration()

```ts
addMigration<TFrom, TTo>(fromVersion, fn): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:185](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L185)

Register a migration function for a specific version step.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TFrom` | The data shape of the source version. |
| `TTo` | The data shape of the target version (source version + 1). |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fromVersion` | `number` | The version number to migrate **from** (e.g., `1` for the v1 -> v2 step). |
| `fn` | [`MigrationFn`](../type-aliases/MigrationFn.md)\<`TFrom`, `TTo`\> | The function that transforms data from `TFrom` to `TTo`. |

#### Returns

`MigrationBuilder`\<`TFinal`\>

This builder instance for method chaining.

***

### build()

```ts
build(currentVersion): MigrationHandler<TFinal>;
```

Defined in: [persistence/src/migration.ts:204](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L204)

Produce the finalized [MigrationHandler](MigrationHandler.md) with all registered migrations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `currentVersion` | `number` | The current schema version number that the application expects. |

#### Returns

[`MigrationHandler`](MigrationHandler.md)\<`TFinal`\>

A migration handler ready to be used with [loadPersistedSnapshot](../functions/loadPersistedSnapshot.md) or [migrateData](../functions/migrateData.md).

***

### withValidator()

```ts
withValidator(fn): MigrationBuilder<TFinal>;
```

Defined in: [persistence/src/migration.ts:196](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/migration.ts#L196)

Attach a type-guard validator that checks the final migrated data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fn` | (`data`) => `data is TFinal` | A function that returns `true` if `data` is a valid `TFinal`. |

#### Returns

`MigrationBuilder`\<`TFinal`\>

This builder instance for method chaining.
