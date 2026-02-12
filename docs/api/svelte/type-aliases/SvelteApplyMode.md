[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteApplyMode

# Type Alias: SvelteApplyMode

```ts
type SvelteApplyMode = "patch" | "replace";
```

Defined in: [svelte.ts:58](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/svelte/src/svelte.ts#L58)

Controls how snapshot data is merged into the Svelte target.

- `'patch'` (default) -- shallow-merges the mapped data into the current state,
  preserving keys not present in the snapshot.
- `'replace'` -- replaces the entire state with the mapped data, deleting keys
  that are no longer present (respecting `pickKeys` / `omitKeys` filters).
