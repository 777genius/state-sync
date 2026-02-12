[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriFileBackendOptions

# Interface: TauriFileBackendOptions

Defined in: [persistence.ts:52](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L52)

Configuration for [createTauriFileBackend](../functions/createTauriFileBackend.md).

## Properties

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: [persistence.ts:104](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L104)

Optional additional arguments forwarded to every Tauri command invocation.

Useful for scoping storage to a specific user, profile, or namespace.

#### Example

```typescript
{ profileId: 'default' }
```

***

### clearCommand?

```ts
optional clearCommand: string;
```

Defined in: [persistence.ts:92](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L92)

Optional Tauri command name for clearing persisted state.

If omitted, calling `clear()` on the returned backend is a no-op.
When provided, the Rust command receives `{ ...args }` and should
delete the stored data.

#### Example

```ts
`'clear_settings'`
```

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: [persistence.ts:60](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L60)

A Tauri-compatible `invoke` function used to call Rust commands.

Typically `invoke` from `@tauri-apps/api/core`.

#### See

[TauriInvoke](../type-aliases/TauriInvoke.md)

***

### loadCommand

```ts
loadCommand: string;
```

Defined in: [persistence.ts:81](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L81)

The Tauri command name for loading a previously persisted snapshot.

The Rust command receives `{ ...args }` (or nothing if `args` is empty)
and should return `SnapshotEnvelope<T> | null`.

#### Example

```ts
`'load_settings'`
```

***

### saveCommand

```ts
saveCommand: string;
```

Defined in: [persistence.ts:71](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L71)

The Tauri command name for persisting a snapshot.

The Rust command receives `{ snapshot: SnapshotEnvelope<T>, ...args }` as
its argument payload. It should write the envelope to disk (or other
durable storage) and return `Ok(())`.

#### Example

```ts
`'save_settings'`
```
