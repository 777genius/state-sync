[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / IndexedDBBackendOptions

# Interface: IndexedDBBackendOptions

Defined in: [persistence/src/storage/indexed-db.ts:11](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L11)

Configuration options for the IndexedDB storage backend.

Allows customization of the database name, object store, versioning,
retry behavior, and lifecycle callbacks used when persisting snapshot data
to the browser's IndexedDB API.

## Properties

### dbName

```ts
dbName: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:18](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L18)

The name of the IndexedDB database to open or create.

This name is scoped to the current origin and should be unique
per application to avoid conflicts.

***

### onBlocked()?

```ts
optional onBlocked: () => void;
```

Defined in: [persistence/src/storage/indexed-db.ts:75](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L75)

Callback invoked when the database open request is blocked by another connection.

This typically happens when another tab has an open connection to an older
version of the database. The blocked state is handled automatically via the
retry mechanism, but this callback can be used for user notification or logging.

#### Returns

`void`

***

### onUpgrade()?

```ts
optional onUpgrade: (db, oldVersion, newVersion) => void;
```

Defined in: [persistence/src/storage/indexed-db.ts:87](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L87)

Callback invoked when the database requires a schema upgrade.

Called after the default upgrade logic (object store creation) has executed.
Use this to perform custom schema migrations such as creating indexes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | `IDBDatabase` | The `IDBDatabase` instance being upgraded. |
| `oldVersion` | `number` | The previous schema version number (0 for newly created databases). |
| `newVersion` | `number` | The new schema version number being upgraded to. |

#### Returns

`void`

***

### recordKey?

```ts
optional recordKey: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:35](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L35)

The key used to store and retrieve the snapshot record within the object store.

A separate metadata record is stored under `${recordKey}:metadata`.

#### Default

```ts
'snapshot'
```

***

### retryAttempts?

```ts
optional retryAttempts: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:57](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L57)

The maximum number of retry attempts when the database connection is blocked
or encounters a version-related error.

A blocked database typically occurs when another tab holds an open connection
to an older version of the database.

#### Default

```ts
3
```

***

### retryDelayMs?

```ts
optional retryDelayMs: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:66](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L66)

The base delay in milliseconds between retry attempts.

The actual delay uses linear backoff: `retryDelayMs * (attemptNumber + 1)`.

#### Default

```ts
100
```

***

### storeName

```ts
storeName: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:26](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L26)

The name of the object store within the database where snapshots are persisted.

The object store is automatically created during the database upgrade
if it does not already exist.

***

### version?

```ts
optional version: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:46](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/indexed-db.ts#L46)

The version number of the IndexedDB database schema.

Incrementing this value triggers the `onupgradeneeded` event, allowing
schema migrations. The object store specified by [storeName](#storename) is
automatically created if it does not exist during an upgrade.

#### Default

```ts
1
```
