[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RevisionSyncOptions

# Interface: RevisionSyncOptions\<T\>

Defined in: [engine.ts:15](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L15)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [engine.ts:19](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L19)

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [engine.ts:21](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L21)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [engine.ts:22](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L22)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`SyncErrorContext`](SyncErrorContext.md) |

#### Returns

`void`

***

### provider

```ts
provider: SnapshotProvider<T>;
```

Defined in: [engine.ts:18](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L18)

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: [engine.ts:20](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L20)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`InvalidationEvent`](InvalidationEvent.md) |

#### Returns

`boolean`

***

### subscriber

```ts
subscriber: InvalidationSubscriber;
```

Defined in: [engine.ts:17](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L17)

***

### topic

```ts
topic: string;
```

Defined in: [engine.ts:16](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L16)
