[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / ZustandSnapshotApplierOptions

# Type Alias: ZustandSnapshotApplierOptions\<State, Data\>

```ts
type ZustandSnapshotApplierOptions<State, Data> = 
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

Defined in: [zustand.ts:85](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/zustand/src/zustand.ts#L85)

Configuration options for [createZustandSnapshotApplier](../functions/createZustandSnapshotApplier.md).

This is a discriminated union on the [mode](ZustandApplyMode.md) field:

- When `mode` is `'patch'` (or omitted), `toState` is expected to return
  `Partial<State>`.
- When `mode` is `'replace'`, `toState` is expected to return the full
  `State`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Zustand store's state object. |
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

- `'patch'`: calls `store.setState(partial)` — non-destructive
  shallow merge. Existing keys not in the snapshot are preserved.
- `'replace'`: calls `store.setState(nextState, true)` — atomic
  state swap. The adapter rebuilds the full state by merging
  excluded keys from the current state with the incoming snapshot.

#### Default Value

`'patch'`

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

A denylist of top-level state keys that the applier must never update.
All other keys are eligible for synchronization.

Mutually exclusive with pickKeys.

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

An allowlist of top-level state keys that the applier is permitted to
update. All other keys are left untouched.

Mutually exclusive with omitKeys.

Use this to keep ephemeral or local-only fields (such as UI flags)
isolated from remote synchronization.

### strict?

```ts
optional strict: boolean;
```

When `true`, the applier throws if `toState` returns a non-plain-object
value (e.g., `null`, an array, or a primitive). When `false`, such
values are silently ignored.

#### Default Value

`true`

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a state patch object.

Use this when the snapshot payload shape differs from the store state
shape, or when you need to derive state from the payload plus current
store state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload from the sync engine. |
| `ctx` | \{ `store`: [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\> | - |

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

Use `'replace'` mode for an atomic full-state swap. The adapter reads
the current state via `getState()`, preserves keys excluded by filters,
and calls `setState(rebuilt, true)`.

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

A denylist of top-level state keys that the applier must never update.
All other keys are eligible for synchronization.

Mutually exclusive with pickKeys.

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

An allowlist of top-level state keys that the applier is permitted to
update. All other keys are left untouched.

Mutually exclusive with omitKeys.

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

When using `'replace'` mode, prefer returning the complete state
object to avoid accidentally leaving stale keys behind.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload from the sync engine. |
| `ctx` | \{ `store`: [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state to replace the current store state with.

#### Default Value

Identity cast — treats `data` as `State`.
