[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / SessionStorageBackendOptions

# Interface: SessionStorageBackendOptions

Defined in: [persistence/src/storage/session-storage.ts:7](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/storage/session-storage.ts#L7)

Options for sessionStorage backend.

## Properties

### deserialize()?

```ts
optional deserialize: (data) => SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/storage/session-storage.ts:21](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/storage/session-storage.ts#L21)

Optional custom deserializer. Defaults to JSON.parse.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |

#### Returns

`SnapshotEnvelope`\<`unknown`\>

***

### key

```ts
key: string;
```

Defined in: [persistence/src/storage/session-storage.ts:11](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/storage/session-storage.ts#L11)

The key to use in sessionStorage.

***

### serialize()?

```ts
optional serialize: (snapshot) => string;
```

Defined in: [persistence/src/storage/session-storage.ts:16](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/storage/session-storage.ts#L16)

Optional custom serializer. Defaults to JSON.stringify.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`unknown`\> |

#### Returns

`string`
