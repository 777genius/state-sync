[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueRefSnapshotApplierOptions

# Type Alias: VueRefSnapshotApplierOptions\<State, Data\>

```ts
type VueRefSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "ref";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "ref";
  toState?: (data, ctx) => State;
};
```

Defined in: [vue.ts:163](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/vue/src/vue.ts#L163)

Configuration options for a Vue **ref** snapshot applier.

When `target` is `'ref'`, the applier replaces `ref.value` with a new object
on every apply. This works with both `ref()` and `shallowRef()`. Vue's
reactivity system will pick up the `.value` change and notify all dependents.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the ref's inner value. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot maps 1:1 to the ref shape. |

## Type Declaration

```ts
{
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "ref";
  toState?: (data, ctx) => Partial<State>;
}
```

### mode?

```ts
optional mode: "patch";
```

Apply mode.

- `'patch'` -- spreads the mapped data onto the current `ref.value`,
  producing a new object reference: `{ ...ref.value, ...patch }`.

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
target: "ref";
```

Must be `'ref'` to opt into the Vue ref target path.

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps raw snapshot data to a partial state patch.

Receives the snapshot payload and a context object containing the target ref.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Data` | The raw snapshot payload. |
| `ctx` | \{ `ref`: [`VueRefLike`](../interfaces/VueRefLike.md)\<`State`\>; \} | Context providing access to the target Vue ref. |
| `ctx.ref` | [`VueRefLike`](../interfaces/VueRefLike.md)\<`State`\> | - |

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
  target: "ref";
  toState?: (data, ctx) => State;
}
```

### mode

```ts
mode: "replace";
```

Apply mode.

- `'replace'` -- replaces `ref.value` entirely with the mapped data,
  preserving only keys excluded by `pickKeys` / `omitKeys` from the current value.

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
target: "ref";
```

Must be `'ref'` to opt into the Vue ref target path.

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
| `ctx` | \{ `ref`: [`VueRefLike`](../interfaces/VueRefLike.md)\<`State`\>; \} | Context providing access to the target Vue ref. |
| `ctx.ref` | [`VueRefLike`](../interfaces/VueRefLike.md)\<`State`\> | - |

#### Returns

`State`

The full next state.

#### Default Value

Identity cast (`data as State`).
