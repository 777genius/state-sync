[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RevisionSyncOptions

# Interface: RevisionSyncOptions\<T\>

Defined in: [engine.ts:43](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L43)

Configuration options for creating a revision-based sync loop.

Provides all the dependencies and behavioral hooks the engine needs to
subscribe to invalidation events, fetch snapshots, apply them locally,
and handle errors. Pass this to [createRevisionSync](../functions/createRevisionSync.md) to obtain
a [RevisionSyncHandle](RevisionSyncHandle.md).

## Example

```ts
const options: RevisionSyncOptions<UserProfile> = {
  topic: 'user-profile',
  subscriber: myWebSocketSubscriber,
  provider: { getSnapshot: () => fetch('/api/snapshot').then(r => r.json()) },
  applier: { apply: ({ data }) => store.setState(data) },
  logger: createConsoleLogger({ debug: true }),
  onError: (ctx) => Sentry.captureException(ctx.error),
  throttling: { debounceMs: 200 },
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [engine.ts:66](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L66)

The snapshot applier that writes fetched data into local state.
Called only when the fetched snapshot has a higher revision than
the current local revision.

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [engine.ts:79](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L79)

Optional logger for tracing engine lifecycle events and errors.
If omitted, the engine operates silently.

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [engine.ts:86](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L86)

Optional error callback invoked whenever the engine encounters an error.
Receives a [SyncErrorContext](SyncErrorContext.md) with structured details about the failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ctx` | [`SyncErrorContext`](SyncErrorContext.md) | The structured error context. |

#### Returns

`void`

***

### provider

```ts
provider: SnapshotProvider<T>;
```

Defined in: [engine.ts:60](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L60)

The snapshot provider used to fetch the latest authoritative state.
Called during the initial load and after each invalidation event
that passes the revision and [shouldRefresh](#shouldrefresh) checks.

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: [engine.ts:74](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L74)

Optional predicate that can suppress a refresh for a specific invalidation event.
Return `false` to skip the refresh; return `true` (or omit) to allow it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`InvalidationEvent`](InvalidationEvent.md) | The normalized [InvalidationEvent](InvalidationEvent.md) that triggered the refresh. |

#### Returns

`boolean`

Whether the engine should proceed with the refresh.

***

### subscriber

```ts
subscriber: InvalidationSubscriber;
```

Defined in: [engine.ts:54](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L54)

The invalidation subscriber that delivers real-time change notifications.
The engine subscribes to it on [RevisionSyncHandle.start](RevisionSyncHandle.md#start) and
unsubscribes on [RevisionSyncHandle.stop](RevisionSyncHandle.md#stop).

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [engine.ts:94](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L94)

Optional throttling configuration to control refresh rate.

Use `debounceMs` to wait for "silence" before refreshing.
Use `throttleMs` to limit refresh frequency.
Both can be combined: debounce is applied first, within the throttle window.

***

### topic

```ts
topic: string;
```

Defined in: [engine.ts:48](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L48)

The topic identifier that scopes this sync loop.
Must be a non-empty string; the engine validates this at creation time.
