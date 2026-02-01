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

Defined in: [pinia.ts:30](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/pinia/src/pinia.ts#L30)

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

- 'patch': calls `store.$patch(partial)` (non-destructive)
- 'replace': applies a top-level replace using `$patch((state) => ...)`:
  - deletes keys not present in `nextState`
  - assigns keys present in `nextState`

Why not `store.$state = nextState`?
Pinia documents that assigning `$state` internally calls `$patch()`, so it
does not reliably remove stale keys on its own.

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
| `ctx` | \{ `store`: [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\>; \} |
| `ctx.store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> |

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
| `ctx` | \{ `store`: [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\>; \} |
| `ctx.store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> |

#### Returns

`State`
