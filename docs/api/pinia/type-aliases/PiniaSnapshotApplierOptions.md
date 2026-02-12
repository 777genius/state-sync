[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / PiniaSnapshotApplierOptions

# Type Alias: PiniaSnapshotApplierOptions\<State, Data\>

```ts
type PiniaSnapshotApplierOptions<State, Data> = 
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

Defined in: [pinia.ts:86](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/pinia/src/pinia.ts#L86)

Configuration options for [createPiniaSnapshotApplier](../functions/createPiniaSnapshotApplier.md).

This is a discriminated union on the [mode](PiniaApplyMode.md) field:

- When `mode` is `'patch'` (or omitted), `toState` is expected to return
  `Partial<State>`.
- When `mode` is `'replace'`, `toState` is expected to return the full
  `State`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Pinia store's reactive state object. |
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

- `'patch'`: calls `store.$patch(partial)` — non-destructive shallow
  merge. Existing keys not present in the snapshot are left untouched.
- `'replace'`: applies a top-level replacement using
  `$patch((state) => ...)`:
  - deletes keys not present in `nextState`
  - assigns keys present in `nextState`

Why not `store.$state = nextState`?
Pinia documents that assigning `$state` internally calls `$patch()`,
so it does not reliably remove stale keys on its own.

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
| `ctx` | \{ `store`: [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> | - |

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

Use `'replace'` mode for a full top-level state swap. Keys in the
store that are not present in the incoming snapshot will be deleted
(subject to key filtering).

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
| `ctx` | \{ `store`: [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\>; \} | Context object providing access to the target store. |
| `ctx.store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state to replace the current store state with.

#### Default Value

Identity cast — treats `data` as `State`.
