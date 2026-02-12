[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStoreSnapshotApplierOptions

# Type Alias: SvelteStoreSnapshotApplierOptions\<State, Data\>

```ts
type SvelteStoreSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => State;
};
```

Defined in: [svelte.ts:76](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L76)

Configuration options for a Svelte **store** snapshot applier.

This union type provides correct return-type narrowing for `toState` depending
on whether `mode` is `'patch'` (returns `Partial<State>`) or `'replace'`
(returns full `State`).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Svelte store value. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot maps 1:1 to the store shape. |

## Type Declaration

```ts
{
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => Partial<State>;
}
```

### mode?

```ts
optional mode: "patch";
```

Apply mode.

- `'patch'` -- shallow-merges mapped data into the current store value.

#### Default Value

`'patch'`

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

Prevent these top-level keys from being updated by snapshots.

Mutually exclusive with `pickKeys`.

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

Allow only these top-level keys to be updated by snapshots.

Mutually exclusive with `omitKeys`.
Use this to protect ephemeral/local-only fields (like UI flags) from being overwritten.

### strict?

```ts
optional strict: boolean;
```

When `true`, throws an error if `toState` returns a non-plain-object value.
When `false`, silently ignores the invalid return value.

#### Default Value

`true`

### target?

```ts
optional target: "store";
```

Target kind. Omit or set to `'store'` for Svelte 4 writable stores.

#### Default Value

`'store'`

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a partial state patch.

Receives the snapshot payload and a context object containing the target store.
Return a partial object whose keys will be shallow-merged into the current value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload. |
| `ctx` | \{ `store`: [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\>; \} | Context providing access to the target store. |
| `ctx.store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> | - |

#### Returns

`Partial`\<`State`\>

A partial state object to merge.

#### Default Value

Identity cast (`data as Partial<State>`).

```ts
{
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => State;
}
```

### mode

```ts
mode: "replace";
```

Apply mode.

- `'replace'` -- replaces the entire store value atomically, removing keys
  not present in the mapped data (respecting key filters).

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

### target?

```ts
optional target: "store";
```

Target kind. Omit or set to `'store'` for Svelte 4 writable stores.

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
| `ctx` | \{ `store`: [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\>; \} | Context providing access to the target store. |
| `ctx.store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state.

#### Default Value

Identity cast (`data as State`).
