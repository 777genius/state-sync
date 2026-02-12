[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / LocalStorageBackendOptions

# Interface: LocalStorageBackendOptions

Defined in: [persistence/src/storage/local-storage.ts:10](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/local-storage.ts#L10)

Configuration options for the localStorage storage backend.

Allows customization of the storage key and serialization behavior
used when persisting snapshot data to the browser's `localStorage` API.

## Properties

### deserialize()?

```ts
optional deserialize: (data) => SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/storage/local-storage.ts:37](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/local-storage.ts#L37)

Custom deserialization function for converting a stored string back into
a snapshot envelope.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The raw string retrieved from `localStorage`. |

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

Defined in: [persistence/src/storage/local-storage.ts:17](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/local-storage.ts#L17)

The key under which snapshot data is stored in `localStorage`.

Must be unique per application or state instance to avoid collisions
with other data stored in the same origin's `localStorage`.

***

### serialize()?

```ts
optional serialize: (snapshot) => string;
```

Defined in: [persistence/src/storage/local-storage.ts:27](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/local-storage.ts#L27)

Custom serialization function for converting a snapshot envelope into a string
suitable for `localStorage` storage.

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
