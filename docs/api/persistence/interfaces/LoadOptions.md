[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / LoadOptions

# Interface: LoadOptions\<T\>

Defined in: [persistence/src/types.ts:756](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L756)

Options for [loadPersistedSnapshot](../functions/loadPersistedSnapshot.md) controlling migration, validation,
TTL enforcement, and integrity checking.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state after any migrations. |

## Properties

### ignoreTTL?

```ts
optional ignoreTTL: boolean;
```

Defined in: [persistence/src/types.ts:790](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L790)

If `true`, load the snapshot even if its TTL has expired.

Useful for "best-effort" hydration where stale data is better than no data.

#### Default Value

`false`

***

### migration?

```ts
optional migration: MigrationHandler<T>;
```

Defined in: [persistence/src/types.ts:764](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L764)

Migration handler for upgrading persisted data to the current schema version.

If the stored schema version differs from the handler's
[MigrationHandler.currentVersion](MigrationHandler.md#currentversion), the appropriate migration
functions are applied in sequence.

***

### validate?

```ts
optional validate: boolean;
```

Defined in: [persistence/src/types.ts:771](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L771)

Whether to run the migration handler's built-in validator on the loaded data.

#### Default Value

`false`

***

### validator()?

```ts
optional validator: (data) => data is T;
```

Defined in: [persistence/src/types.ts:781](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L781)

A custom type-guard function to validate the loaded (and possibly migrated) data.

If provided and the function returns `false`, the snapshot is discarded.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The deserialized snapshot data to validate. |

#### Returns

`data is T`

`true` if the data matches the expected shape `T`.

***

### verifyHash?

```ts
optional verifyHash: boolean;
```

Defined in: [persistence/src/types.ts:800](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L800)

If `true`, verify the stored integrity hash against the loaded data.

When the hash does not match, the snapshot is discarded and an error
is emitted via the `onPersistenceError` callback.

#### Default Value

`false`
