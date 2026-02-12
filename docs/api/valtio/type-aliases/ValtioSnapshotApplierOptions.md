[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / ValtioSnapshotApplierOptions

# Type Alias: ValtioSnapshotApplierOptions\<State, Data\>

```ts
type ValtioSnapshotApplierOptions<State, Data> = 
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

Defined in: [valtio.ts:58](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/valtio/src/valtio.ts#L58)

Configuration options for [createValtioSnapshotApplier](../functions/createValtioSnapshotApplier.md).

This is a discriminated union on the [mode](ValtioApplyMode.md) field:

- When `mode` is `'patch'` (or omitted), `toState` is expected to return
  `Partial<State>`.
- When `mode` is `'replace'`, `toState` is expected to return the full
  `State`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Valtio proxy's state object. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the proxy shape directly. |

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

- `'patch'`: iterates filtered keys and assigns each one directly
  on the proxy (`proxy[key] = value`). Keys not in the snapshot are
  left untouched.
- `'replace'`: first deletes allowed keys not present in the new
  state, then assigns keys present in the new state. The proxy
  reference remains the same throughout.

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

Use this when the snapshot payload shape differs from the proxy state
shape, or when you need to derive state from the payload plus current
proxy state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload from the sync engine. |
| `ctx` | \{ `proxy`: [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\>; \} | Context object providing access to the target proxy. |
| `ctx.proxy` | [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\> | - |

#### Returns

`Partial`\<`State`\>

A partial state object whose keys will be assigned to the
  proxy.

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

Use `'replace'` mode for a full top-level state swap on the proxy.
Allowed keys not present in the incoming snapshot are deleted; the
proxy reference itself is never replaced.

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
| `ctx` | \{ `proxy`: [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\>; \} | Context object providing access to the target proxy. |
| `ctx.proxy` | [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state to apply onto the proxy.

#### Default Value

Identity cast — treats `data` as `State`.
