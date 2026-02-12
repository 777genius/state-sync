[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteTargetKind

# Type Alias: SvelteTargetKind

```ts
type SvelteTargetKind = "store" | "state";
```

Defined in: [svelte.ts:48](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/svelte/src/svelte.ts#L48)

Discriminator for the Svelte applier target.

- `'store'` -- targets a Svelte 4 writable store via `set()` / `update()`.
- `'state'` -- targets a Svelte 5 `$state` rune proxy via in-place property mutation.
