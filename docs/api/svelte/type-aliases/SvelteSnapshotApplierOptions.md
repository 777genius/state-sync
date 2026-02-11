[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteSnapshotApplierOptions

# Type Alias: SvelteSnapshotApplierOptions\<State, Data\>

```ts
type SvelteSnapshotApplierOptions<State, Data> = 
  | SvelteStoreSnapshotApplierOptions<State, Data>
| SvelteStateSnapshotApplierOptions<State, Data>;
```

Defined in: [svelte.ts:64](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/svelte/src/svelte.ts#L64)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
