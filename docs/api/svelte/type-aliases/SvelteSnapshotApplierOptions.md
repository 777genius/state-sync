[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteSnapshotApplierOptions

# Type Alias: SvelteSnapshotApplierOptions\<State, Data\>

```ts
type SvelteSnapshotApplierOptions<State, Data> = 
  | SvelteStoreSnapshotApplierOptions<State, Data>
| SvelteStateSnapshotApplierOptions<State, Data>;
```

Defined in: [svelte.ts:252](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/svelte/src/svelte.ts#L252)

Union of all Svelte snapshot applier option shapes.

Discriminated by the `target` field:
- `'store'` (or omitted) -- [SvelteStoreSnapshotApplierOptions](SvelteStoreSnapshotApplierOptions.md)
- `'state'` -- [SvelteStateSnapshotApplierOptions](SvelteStateSnapshotApplierOptions.md)

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Svelte store or `$state` proxy. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. |
