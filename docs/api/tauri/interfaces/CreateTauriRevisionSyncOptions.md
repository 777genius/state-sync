[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / CreateTauriRevisionSyncOptions

# Interface: CreateTauriRevisionSyncOptions\<T\>

Defined in: [sync.ts:46](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L46)

Configuration for [createTauriRevisionSync](../functions/createTauriRevisionSync.md).

Merges Tauri-specific transport options (event name, command name, IPC
functions) with the core engine options (applier, logger, error handler,
throttling) into a single flat object for ergonomic one-call setup.

## Example

```typescript
const options: CreateTauriRevisionSyncOptions<MyState> = {
  topic: 'my-state',
  listen,
  invoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_my_state',
  applier: { apply: (snap) => store.setState(snap.data) },
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

Defined in: [sync.ts:103](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L103)

The applier responsible for integrating a fetched snapshot into your
application state (e.g., updating a store, patching the UI).

#### See

SnapshotApplier

***

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: [sync.ts:95](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L95)

Optional additional arguments forwarded to the snapshot command on every invoke.

Useful for scoping the snapshot to a specific user, workspace, or resource.

***

### commandName

```ts
commandName: string;
```

Defined in: [sync.ts:88](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L88)

The Tauri command name invoked to fetch the current snapshot.

The Rust command must return a JSON object matching
`{ revision: string, data: T }` (a SnapshotEnvelope).

***

### eventName

```ts
eventName: string;
```

Defined in: [sync.ts:80](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L80)

The Tauri event name to listen on for invalidation notifications.

Must match the event name emitted by the Rust backend
(e.g., `app.emit("state-sync:invalidation", payload)`).

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: [sync.ts:72](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L72)

A Tauri-compatible `invoke` function for calling Rust commands.

Typically `invoke` from `@tauri-apps/api/core`.

#### See

[TauriInvoke](../type-aliases/TauriInvoke.md)

***

### listen

```ts
listen: TauriListen;
```

Defined in: [sync.ts:63](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L63)

A Tauri-compatible `listen` function for subscribing to backend events.

Typically `listen` from `@tauri-apps/api/event`.

#### See

[TauriListen](../type-aliases/TauriListen.md)

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [sync.ts:119](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L119)

Optional structured logger for debug, warn, and error messages
produced by the sync engine.

Forwarded directly to the core engine's `logger` option.

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [sync.ts:127](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L127)

Optional error callback invoked whenever the sync engine encounters
a problem (failed snapshot fetch, apply error, protocol violation, etc.).

Forwarded directly to the core engine's `onError` option.

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

Defined in: [sync.ts:111](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L111)

Optional predicate evaluated before each refresh. If it returns `false`,
the invalidation is silently ignored.

Forwarded directly to the core engine's `shouldRefresh` option.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [sync.ts:135](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L135)

Optional throttling / debouncing configuration to control how often
rapid invalidation events trigger a snapshot refresh.

#### See

InvalidationThrottlingOptions

***

### topic

```ts
topic: string;
```

Defined in: [sync.ts:54](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/sync.ts#L54)

A stable identifier for the synchronized domain or resource.

Must be a non-empty string. This value is matched against the `topic`
field in incoming InvalidationEvents so that only relevant
events trigger a refresh.
