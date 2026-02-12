[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / SessionStorageBackendOptions

# Interface: SessionStorageBackendOptions

Defined in: [persistence/src/storage/session-storage.ts:10](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/session-storage.ts#L10)

Configuration options for the sessionStorage storage backend.

Allows customization of the storage key and serialization behavior
used when persisting snapshot data to the browser's `sessionStorage` API.

## Properties

### deserialize()?

```ts
optional deserialize: (data) => SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/storage/session-storage.ts:37](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/session-storage.ts#L37)

Custom deserialization function for converting a stored string back into
a snapshot envelope.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The raw string retrieved from `sessionStorage`. |

#### Returns

`SnapshotEnvelope`\<`unknown`\>

The deserialized snapshot envelope.

#### Default

```ts
JSON.parse
```

***

### key

```ts
key: string;
```

Defined in: [persistence/src/storage/session-storage.ts:17](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/session-storage.ts#L17)

The key under which snapshot data is stored in `sessionStorage`.

Must be unique per application or state instance to avoid collisions
with other data stored in the same origin's `sessionStorage`.

***

### serialize()?

```ts
optional serialize: (snapshot) => string;
```

Defined in: [persistence/src/storage/session-storage.ts:27](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/session-storage.ts#L27)

Custom serialization function for converting a snapshot envelope into a string
suitable for `sessionStorage` storage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`unknown`\> | The snapshot envelope to serialize. |

#### Returns

`string`

A string representation of the snapshot.

#### Default

```ts
JSON.stringify
```
