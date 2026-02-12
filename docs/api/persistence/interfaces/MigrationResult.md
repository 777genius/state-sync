[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationResult

# Interface: MigrationResult\<T\>

Defined in: [persistence/src/types.ts:391](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L391)

The outcome of a data migration attempt.

Contains the migrated data on success, or an Error describing what
went wrong on failure. Always includes the version range that was attempted.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state in the target schema version. |

## Properties

### data?

```ts
optional data: T;
```

Defined in: [persistence/src/types.ts:400](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L400)

The migrated data in the target schema format.

Only present when [success](#success) is `true`.

***

### error?

```ts
optional error: Error;
```

Defined in: [persistence/src/types.ts:413](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L413)

The error that caused the migration to fail.

Only present when [success](#success) is `false`.

***

### fromVersion

```ts
fromVersion: number;
```

Defined in: [persistence/src/types.ts:403](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L403)

The schema version of the data **before** migration was attempted.

***

### success

```ts
success: boolean;
```

Defined in: [persistence/src/types.ts:393](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L393)

Whether the migration completed successfully.

***

### toVersion

```ts
toVersion: number;
```

Defined in: [persistence/src/types.ts:406](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L406)

The target schema version the migration aimed to reach.
