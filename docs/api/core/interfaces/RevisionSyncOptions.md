[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RevisionSyncOptions

# Interface: RevisionSyncOptions\<T\>

Defined in: [engine.ts:20](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L20)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [engine.ts:24](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L24)

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [engine.ts:26](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L26)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [engine.ts:27](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L27)

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

Defined in: [engine.ts:23](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L23)

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: [engine.ts:25](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L25)

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

Defined in: [engine.ts:22](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L22)

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [engine.ts:33](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L33)

Optional throttling configuration to control refresh rate.
Use debounceMs to wait for "silence" before refreshing.
Use throttleMs to limit refresh frequency.

***

### topic

```ts
topic: string;
```

Defined in: [engine.ts:21](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L21)
