[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueReactiveSnapshotApplierOptions

# Type Alias: VueReactiveSnapshotApplierOptions\<State, Data\>

```ts
type VueReactiveSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "reactive";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "reactive";
  toState?: (data, ctx) => State;
};
```

Defined in: [vue.ts:69](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/vue/src/vue.ts#L69)

Configuration options for a Vue **reactive** snapshot applier.

When `target` is `'reactive'` (or omitted), the applier mutates the reactive
proxy in-place (property assignment / `delete`), which is how Vue 3 tracks
changes on `reactive()` objects.

This union type provides correct return-type narrowing for `toState` depending
on whether `mode` is `'patch'` (returns `Partial<State>`) or `'replace'`
(returns full `State`).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Vue reactive object. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot maps 1:1 to the reactive shape. |

## Type Declaration

```ts
{
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "reactive";
  toState?: (data, ctx) => Partial<State>;
}
```

### mode?

```ts
optional mode: "patch";
```

Apply mode.

- `'patch'` -- assigns mapped properties onto the existing reactive proxy.

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
Use this to keep ephemeral/local-only fields (like UI flags) isolated.

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
optional target: "reactive";
```

Target kind. Omit or set to `'reactive'` for Vue `reactive()` objects.

#### Default Value

`'reactive'`

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a partial state patch.

Receives the snapshot payload and a context object containing the reactive proxy.
Return a partial object whose keys will be assigned in-place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload. |
| `ctx` | \{ `state`: `State`; \} | Context providing access to the reactive state proxy. |
| `ctx.state` | `State` | - |

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
  target?: "reactive";
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

### target?

```ts
optional target: "reactive";
```

Target kind. Omit or set to `'reactive'` for Vue `reactive()` objects.

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
| `ctx` | \{ `state`: `State`; \} | Context providing access to the reactive state proxy. |
| `ctx.state` | `State` | - |

#### Returns

`State`

The full next state.

#### Default Value

Identity cast (`data as State`).
