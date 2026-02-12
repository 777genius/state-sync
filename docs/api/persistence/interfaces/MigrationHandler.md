[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationHandler

# Interface: MigrationHandler\<T\>

Defined in: [persistence/src/types.ts:345](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L345)

Configuration for schema-versioned data migration.

Defines the current schema version, a map of migration functions, and an
optional type-guard validator. During load, the persistence applier compares
the stored schema version against [currentVersion](#currentversion) and applies the
necessary migration functions in sequence.

## Example

```typescript
const handler: MigrationHandler<AppStateV3> = {
  currentVersion: 3,
  migrations: {
    1: (v1) => ({ ...v1, newField: 'default' }),
    2: (v2) => ({ ...v2, renamedField: v2.oldField }),
  },
  validate: (data): data is AppStateV3 => 'renamedField' in (data as object),
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state in the **current** schema version. |

## Properties

### currentVersion

```ts
currentVersion: number;
```

Defined in: [persistence/src/types.ts:352](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L352)

The schema version that the current application code expects.

Must be a positive integer. All persisted data with a lower version will
be migrated up to this version during load.

***

### migrations

```ts
migrations: Record<number, MigrationFn<any, unknown>>;
```

Defined in: [persistence/src/types.ts:369](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L369)

A record of migration functions keyed by **source** version number.

Each entry transforms data from version `N` to version `N + 1`.
For example, `{ 1: fn }` migrates v1 data to v2.

#### Example

```typescript
migrations: {
  1: (v1Data) => ({ ...v1Data, newField: 'default' }),  // v1 -> v2
  2: (v2Data) => ({ ...v2Data, renamed: v2Data.old }),   // v2 -> v3
}
```

***

### validate()?

```ts
optional validate: (data) => data is T;
```

Defined in: [persistence/src/types.ts:380](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L380)

Optional type-guard function to validate the fully migrated data.

Called after all migration steps complete. If it returns `false`,
the migration is considered failed and the persisted data is discarded.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The data after all migrations have been applied. |

#### Returns

`data is T`

`true` if the data matches the expected shape `T`.
