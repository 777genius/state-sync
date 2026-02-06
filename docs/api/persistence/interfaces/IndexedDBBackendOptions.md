[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / IndexedDBBackendOptions

# Interface: IndexedDBBackendOptions

Defined in: [persistence/src/storage/indexed-db.ts:7](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L7)

Options for IndexedDB backend.

## Properties

### dbName

```ts
dbName: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:11](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L11)

Database name.

***

### onBlocked()?

```ts
optional onBlocked: () => void;
```

Defined in: [persistence/src/storage/indexed-db.ts:41](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L41)

Called when database is blocked by another connection.

#### Returns

`void`

***

### onUpgrade()?

```ts
optional onUpgrade: (db, oldVersion, newVersion) => void;
```

Defined in: [persistence/src/storage/indexed-db.ts:46](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L46)

Called when database upgrade is needed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | `IDBDatabase` |
| `oldVersion` | `number` |
| `newVersion` | `number` |

#### Returns

`void`

***

### recordKey?

```ts
optional recordKey: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:21](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L21)

Optional key for the snapshot record. Defaults to 'snapshot'.

***

### retryAttempts?

```ts
optional retryAttempts: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:31](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L31)

Number of retry attempts for blocked database. Defaults to 3.

***

### retryDelayMs?

```ts
optional retryDelayMs: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:36](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L36)

Delay between retries in ms. Defaults to 100.

***

### storeName

```ts
storeName: string;
```

Defined in: [persistence/src/storage/indexed-db.ts:16](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L16)

Object store name.

***

### version?

```ts
optional version: number;
```

Defined in: [persistence/src/storage/indexed-db.ts:26](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L26)

Optional database version. Defaults to 1.
