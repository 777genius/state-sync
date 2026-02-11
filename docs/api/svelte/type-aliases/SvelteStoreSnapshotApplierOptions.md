[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStoreSnapshotApplierOptions

# Type Alias: SvelteStoreSnapshotApplierOptions\<State, Data\>

```ts
type SvelteStoreSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "store";
  toState?: (data, ctx) => State;
};
```

Defined in: [svelte.ts:28](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/svelte/src/svelte.ts#L28)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
