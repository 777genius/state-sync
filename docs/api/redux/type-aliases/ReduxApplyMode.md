[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / ReduxApplyMode

# Type Alias: ReduxApplyMode

```ts
type ReduxApplyMode = "patch" | "replace";
```

Defined in: redux.ts:20

The strategy used to apply incoming snapshot data to the Redux store.

- `'patch'` — Non-destructive shallow merge. Existing keys not present
  in the snapshot are left untouched.
- `'replace'` — Atomic state swap. The entire state is replaced; keys
  excluded by `omitKeys` are preserved by being merged back.
