[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteSnapshotApplierOptions

# Type Alias: SvelteSnapshotApplierOptions\<State, Data\>

```ts
type SvelteSnapshotApplierOptions<State, Data> = 
  | SvelteStoreSnapshotApplierOptions<State, Data>
| SvelteStateSnapshotApplierOptions<State, Data>;
```

Defined in: [svelte.ts:64](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/svelte/src/svelte.ts#L64)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
