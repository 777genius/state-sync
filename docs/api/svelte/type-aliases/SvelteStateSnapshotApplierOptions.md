[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStateSnapshotApplierOptions

# Type Alias: SvelteStateSnapshotApplierOptions\<State, Data\>

```ts
type SvelteStateSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "state";
  toState?: (data, ctx) => State;
};
```

Defined in: [svelte.ts:46](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/svelte/src/svelte.ts#L46)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
