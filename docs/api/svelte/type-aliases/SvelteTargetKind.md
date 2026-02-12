[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteTargetKind

# Type Alias: SvelteTargetKind

```ts
type SvelteTargetKind = "store" | "state";
```

Defined in: [svelte.ts:48](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L48)

Discriminator for the Svelte applier target.

- `'store'` -- targets a Svelte 4 writable store via `set()` / `update()`.
- `'state'` -- targets a Svelte 5 `$state` rune proxy via in-place property mutation.
