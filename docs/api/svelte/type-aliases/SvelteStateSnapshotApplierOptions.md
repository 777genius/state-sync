[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStateSnapshotApplierOptions

# Type Alias: SvelteStateSnapshotApplierOptions\<State, Data\>

```ts
type SvelteStateSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => State;
};
```

Defined in: [svelte.ts:170](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L170)

Configuration options for a Svelte 5 **$state** snapshot applier.

When `target` is `'state'`, the applier mutates the state proxy object in-place
(property assignment / `delete`), which is how Svelte 5 fine-grained reactivity
tracks changes. No new object reference is created.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the `$state` proxy object. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot maps 1:1 to the state shape. |

## Type Declaration

```ts
{
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => Partial<State>;
}
```

### mode?

```ts
optional mode: "patch";
```

Apply mode.

- `'patch'` -- assigns mapped properties onto the existing state proxy.

#### Default Value

`'patch'`

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

Prevent these top-level keys from being updated by snapshots. Mutually exclusive with `pickKeys`.

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

Allow only these top-level keys to be updated by snapshots. Mutually exclusive with `omitKeys`.

### strict?

```ts
optional strict: boolean;
```

When `true`, throws an error if `toState` returns a non-plain-object value.

#### Default Value

`true`

### target

```ts
target: "state";
```

Must be `'state'` to opt into the Svelte 5 `$state` proxy target path.

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a partial state patch.

Receives the snapshot payload and a context object containing the current state proxy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload. |
| `ctx` | \{ `state`: `State`; \} | Context providing access to the current `$state` proxy. |
| `ctx.state` | `State` | - |

#### Returns

`Partial`\<`State`\>

A partial state object whose properties will be assigned in-place.

#### Default Value

Identity cast (`data as Partial<State>`).

```ts
{
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => State;
}
```

### mode

```ts
mode: "replace";
```

Apply mode.

- `'replace'` -- deletes keys not present in the mapped data, then assigns
  the new keys. Keys excluded by `pickKeys` / `omitKeys` are left untouched.

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

Prevent these top-level keys from being updated by snapshots. Mutually exclusive with `pickKeys`.

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

Allow only these top-level keys to be updated by snapshots. Mutually exclusive with `omitKeys`.

### strict?

```ts
optional strict: boolean;
```

When `true`, throws an error if `toState` returns a non-plain-object value.

#### Default Value

`true`

### target

```ts
target: "state";
```

Must be `'state'` to opt into the Svelte 5 `$state` proxy target path.

### toState()?

```ts
optional toState: (data, ctx) => State;
```

Maps raw snapshot data to a full next state.

When using `'replace'` mode, prefer returning the complete state to avoid
accidentally leaving stale keys.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload. |
| `ctx` | \{ `state`: `State`; \} | Context providing access to the current `$state` proxy. |
| `ctx.state` | `State` | - |

#### Returns

`State`

The full next state.

#### Default Value

Identity cast (`data as State`).
