[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / CreateElectronRevisionSyncOptions

# Interface: CreateElectronRevisionSyncOptions\<T\>

Defined in: sync.ts:12

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: sync.ts:16

***

### bridge

```ts
bridge: ElectronStateSyncBridge;
```

Defined in: sync.ts:15

The bridge object from window.statesync

***

### invalidationChannel?

```ts
optional invalidationChannel: string;
```

Defined in: sync.ts:19

Override default channel: statesync:${topic}:invalidated

***

### logger?

```ts
optional logger: Logger;
```

Defined in: sync.ts:24

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: sync.ts:25

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | `SyncErrorContext` |

#### Returns

`void`

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: sync.ts:23

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

***

### snapshotChannel?

```ts
optional snapshotChannel: string;
```

Defined in: sync.ts:21

Override default channel: statesync:${topic}:snapshot

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: sync.ts:26

***

### topic

```ts
topic: string;
```

Defined in: sync.ts:13
