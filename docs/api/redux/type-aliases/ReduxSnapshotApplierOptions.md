[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / ReduxSnapshotApplierOptions

# Type Alias: ReduxSnapshotApplierOptions\<State, Data\>

```ts
type ReduxSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  toState?: (data, ctx) => State;
};
```

Defined in: redux.ts:98

Configuration options for [createReduxSnapshotApplier](../functions/createReduxSnapshotApplier.md).

This is a discriminated union on the [mode](ReduxApplyMode.md) field:

- When `mode` is `'patch'` (or omitted), `toState` is expected to return
  `Partial<State>`.
- When `mode` is `'replace'`, `toState` is expected to return the full
  `State`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Redux store's state. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the store shape directly. |

## Type Declaration

```ts
{
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  toState?: (data, ctx) => Partial<State>;
}
```

### mode?

```ts
optional mode: "patch";
```

The apply strategy. Defaults to `'patch'`.

- `'patch'`: dispatches an action with partial state — the HOF reducer
  performs a non-destructive shallow merge.
- `'replace'`: dispatches an action with full state — the HOF reducer
  replaces the entire state, preserving omitted keys.

#### Default Value

`'patch'`

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

### strict?

```ts
optional strict: boolean;
```

When `true`, the applier throws if `toState` returns a non-plain-object
value. When `false`, such values are silently ignored.

#### Default Value

`true`

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a state patch object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload from the sync engine. |
| `ctx` | \{ `store`: [`ReduxStoreLike`](../interfaces/ReduxStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`ReduxStoreLike`](../interfaces/ReduxStoreLike.md)\<`State`\> | - |

#### Returns

`Partial`\<`State`\>

A partial state object to be shallow-merged into the store.

#### Default Value

Identity cast — treats `data` as `Partial<State>`.

```ts
{
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  toState?: (data, ctx) => State;
}
```

### mode

```ts
mode: "replace";
```

Use `'replace'` mode for an atomic full-state swap.

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

### strict?

```ts
optional strict: boolean;
```

When `true`, the applier throws if `toState` returns a non-plain-object
value. When `false`, such values are silently ignored.

#### Default Value

`true`

### toState()?

```ts
optional toState: (data, ctx) => State;
```

Maps raw snapshot data to the full next state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload from the sync engine. |
| `ctx` | \{ `store`: [`ReduxStoreLike`](../interfaces/ReduxStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`ReduxStoreLike`](../interfaces/ReduxStoreLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state to replace the current store state with.

#### Default Value

Identity cast — treats `data` as `State`.
