[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriFileBackendOptions

# Interface: TauriFileBackendOptions

Defined in: persistence.ts:17

Options for Tauri file-based storage backend.

## Properties

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: persistence.ts:43

Optional additional arguments to pass to all commands.

***

### clearCommand?

```ts
optional clearCommand: string;
```

Defined in: persistence.ts:38

Optional command name for clearing state.

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: persistence.ts:21

Tauri invoke function.

***

### loadCommand

```ts
loadCommand: string;
```

Defined in: persistence.ts:33

Command name for loading state.
The command should return `SnapshotEnvelope<T> | null`.

***

### saveCommand

```ts
saveCommand: string;
```

Defined in: persistence.ts:27

Command name for saving state.
The command receives `{ snapshot: SnapshotEnvelope<T> }` + args.
