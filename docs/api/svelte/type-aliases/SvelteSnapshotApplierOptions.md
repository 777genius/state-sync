[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteSnapshotApplierOptions

# Type Alias: SvelteSnapshotApplierOptions\<State, Data\>

```ts
type SvelteSnapshotApplierOptions<State, Data> = 
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

Defined in: svelte.ts:26

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |

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

Default: 'patch'

- 'patch': calls `store.update(current => ({ ...current, ...filteredPatch }))`
  Spread merge creates a new reference (Svelte reactivity requires new reference).
- 'replace': builds a new state keeping omitted keys from current,
  assigns allowed keys from snapshot. Always creates a new reference.

### omitKeys?

```ts
optional omitKeys: ReadonlyArray<keyof State>;
```

### pickKeys?

```ts
optional pickKeys: ReadonlyArray<keyof State>;
```

Limit which top-level keys are allowed to be updated by snapshots.

Use this to keep ephemeral/local-only fields (like UI flags) isolated.

### strict?

```ts
optional strict: boolean;
```

If true, throws when `toState` returns a non-object value.
Default: true

### toState()?

```ts
optional toState: (data, ctx) => Partial<State>;
```

Maps snapshot data to a state patch.

Default: identity cast (treats `data` as `Partial<State>`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `Data` |
| `ctx` | \{ `store`: [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\>; \} |
| `ctx.store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> |

#### Returns

`Partial`\<`State`\>

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

### toState()?

```ts
optional toState: (data, ctx) => State;
```

Maps snapshot data to a full next state.

When using 'replace', prefer returning the full state to avoid leaving stale keys.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `Data` |
| `ctx` | \{ `store`: [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\>; \} |
| `ctx.store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> |

#### Returns

`State`
