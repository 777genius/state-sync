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

Defined in: [valtio.ts:18](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/valtio/src/valtio.ts#L18)

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

- 'patch': iterates filtered keys and assigns `proxy[key] = value`
- 'replace': first deletes allowed keys not in new state, then assigns
  keys present in new state. The proxy reference stays the same.

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
| `ctx` | \{ `proxy`: [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\>; \} |
| `ctx.proxy` | [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\> |

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
| `ctx` | \{ `proxy`: [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\>; \} |
| `ctx.proxy` | [`ValtioProxyLike`](ValtioProxyLike.md)\<`State`\> |

#### Returns

`State`
