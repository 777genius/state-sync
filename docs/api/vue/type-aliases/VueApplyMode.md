[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueApplyMode

# Type Alias: VueApplyMode

```ts
type VueApplyMode = "patch" | "replace";
```

Defined in: [vue.ts:47](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/vue/src/vue.ts#L47)

Controls how snapshot data is merged into the Vue target.

- `'patch'` (default) -- shallow-merges the mapped data into the current state,
  preserving keys not present in the snapshot.
- `'replace'` -- replaces the entire state with the mapped data, deleting keys
  that are no longer present (respecting `pickKeys` / `omitKeys` filters).
