[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriSnapshotProviderOptions

# Interface: TauriSnapshotProviderOptions

Defined in: [transport.ts:146](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L146)

Configuration for [createTauriSnapshotProvider](../functions/createTauriSnapshotProvider.md).

## Properties

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: [transport.ts:175](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L175)

Optional additional arguments forwarded to the Tauri command on every call.

Useful for passing identifiers like a user ID or workspace key so the
backend knows which slice of state to return.

#### Example

```typescript
{ workspaceId: 'ws_abc123' }
```

***

### commandName

```ts
commandName: string;
```

Defined in: [transport.ts:162](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L162)

The name of the Tauri command that returns the current snapshot.

The Rust command must return a JSON object matching
`{ revision: string, data: T }` (i.e., a SnapshotEnvelope).

#### Example

```ts
`'get_app_state'`
```

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: [transport.ts:152](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L152)

A Tauri-compatible `invoke` function used to call Rust commands.

#### See

[TauriInvoke](../type-aliases/TauriInvoke.md)
