[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / StorageBackend

# Interface: StorageBackend\<T\>

Defined in: persistence.ts:8

Abstract storage backend interface (mirrors @statesync/persistence).
Defined here to avoid requiring persistence as a dependency.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### clear()?

```ts
optional clear(): Promise<void>;
```

Defined in: persistence.ts:11

#### Returns

`Promise`\<`void`\>

***

### load()

```ts
load(): Promise<SnapshotEnvelope<T> | null>;
```

Defined in: persistence.ts:10

#### Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

***

### save()

```ts
save(snapshot): Promise<void>;
```

Defined in: persistence.ts:9

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`Promise`\<`void`\>
