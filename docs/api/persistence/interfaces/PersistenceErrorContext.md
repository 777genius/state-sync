[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceErrorContext

# Interface: PersistenceErrorContext

Defined in: [persistence/src/types.ts:535](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L535)

Contextual information provided to the `onPersistenceError` callback when
a persistence operation fails.

Includes the failing operation name, the error, and (when available) the
snapshot and metadata involved. Useful for logging, metrics, and diagnostics.

## Properties

### error

```ts
error: unknown;
```

Defined in: [persistence/src/types.ts:547](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L547)

The error that was thrown or created during the operation.

***

### metadata?

```ts
optional metadata: PersistedSnapshotMetadata;
```

Defined in: [persistence/src/types.ts:553](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L553)

The metadata associated with the snapshot, if available.

***

### operation

```ts
operation: "load" | "clear" | "save" | "migrate";
```

Defined in: [persistence/src/types.ts:544](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L544)

The persistence operation that failed.

- `'save'` -- writing a snapshot to storage
- `'load'` -- reading a snapshot from storage or validation failure
- `'clear'` -- removing persisted data
- `'migrate'` -- transforming data between schema versions

***

### snapshot?

```ts
optional snapshot: SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/types.ts:550](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L550)

The snapshot involved in the failed operation, if available.
