---
title: toState mapping & key filtering
---

# toState mapping & key filtering

Transform backend data shapes and protect local-only fields.

## The problem

Backend returns `snake_case` fields and a flat structure. Your Zustand store uses `camelCase` and has UI-only fields like `isLoading`. You need to map one to the other without manual glue code.

## toState: transform on apply

Every adapter has a `toState` callback that maps snapshot data to your store's shape:

```typescript
import { createZustandSnapshotApplier } from '@statesync/zustand';

// Backend returns this:
interface BackendUser {
  user_name: string;
  avatar_url: string | null;
  created_at: string;
}

// Store expects this:
interface UserState {
  userName: string;
  avatarUrl: string | null;
  createdAt: Date;
  isLoading: boolean;  // UI-only
  error: string | null; // UI-only
}

const applier = createZustandSnapshotApplier(useUserStore, {
  mode: 'patch',
  omitKeys: ['isLoading', 'error'],
  toState: (data: BackendUser) => ({
    userName: data.user_name,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at),
  }),
});
```

Now when a snapshot arrives with `{ user_name: "alice", avatar_url: null, created_at: "2024-01-01" }`, the store receives `{ userName: "alice", avatarUrl: null, createdAt: Date }`. The `isLoading` and `error` fields are untouched.

## toState with ctx parameter

The second argument gives you access to current store state:

```typescript
const applier = createZustandSnapshotApplier(useSettingsStore, {
  mode: 'patch',
  toState: (data: BackendSettings, ctx) => {
    const current = ctx.store.getState();

    return {
      theme: data.theme,
      language: data.language,
      // Keep local override if user hasn't saved yet
      fontSize: current.hasLocalOverride ? current.fontSize : data.font_size,
    };
  },
});
```

## pickKeys vs omitKeys

Two ways to control which keys get synced:

```typescript
// Whitelist: ONLY sync these keys
const applier = createPiniaSnapshotApplier(store, {
  mode: 'patch',
  pickKeys: ['theme', 'language', 'fontSize'],
  // Everything else (isLoading, error, actions) is protected
});

// Blacklist: sync everything EXCEPT these keys
const applier = createPiniaSnapshotApplier(store, {
  mode: 'patch',
  omitKeys: ['isLoading', 'error', 'isSaving'],
  // Everything else gets synced
});
```

`pickKeys` and `omitKeys` are **mutually exclusive** — use one or the other.

## How key filtering works with modes

### patch mode

Filtered keys are simply not included in the `$patch()` / `setState()` call:

```typescript
// Snapshot data: { theme: 'dark', language: 'en', fontSize: 16 }
// omitKeys: ['fontSize']
// Result: store.$patch({ theme: 'dark', language: 'en' })
// fontSize stays at its current value
```

### replace mode

Filtered keys are **preserved from current state**. Everything else is replaced:

```typescript
// Current state: { theme: 'light', language: 'en', isLoading: true }
// Snapshot data: { theme: 'dark', language: 'fr' }
// omitKeys: ['isLoading']
// Result: { theme: 'dark', language: 'fr', isLoading: true }
//          ↑ replaced       ↑ replaced       ↑ preserved
```

## Full example: Pinia with toState + omitKeys

```typescript
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { useProductStore } from './stores/product';

interface BackendProduct {
  product_id: string;
  display_name: string;
  price_cents: number;
  in_stock: boolean;
}

const store = useProductStore();

const applier = createPiniaSnapshotApplier(store, {
  mode: 'patch',
  omitKeys: ['isEditing', 'validationErrors'],
  toState: (data: BackendProduct) => ({
    id: data.product_id,
    name: data.display_name,
    price: data.price_cents / 100,
    inStock: data.in_stock,
  }),
});

const sync = createRevisionSync({
  topic: 'product',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

## Adapter-specific ctx

| Adapter | `ctx` contains |
|---------|---------------|
| `@statesync/pinia` | `{ store: PiniaStoreLike }` |
| `@statesync/zustand` | `{ store: ZustandStoreLike }` |
| `@statesync/valtio` | `{ proxy: ValtioProxyLike }` |
| `@statesync/svelte` | `{ store: SvelteStoreLike }` |
| `@statesync/vue` (reactive) | `{ state: ReactiveObject }` |
| `@statesync/vue` (ref) | `{ ref: VueRefLike }` |

## Key points

1. **toState runs before key filtering** — map first, then pickKeys/omitKeys filters the mapped result.

2. **ctx gives current state** — use it for conditional mapping (keep local override, merge arrays, etc.).

3. **pickKeys is safer for large stores** — explicitly list what gets synced instead of hoping you didn't forget an omitKey.

4. **Works with both modes** — patch preserves unlisted keys, replace rebuilds state but preserves filtered keys.

## See also

- [@statesync/zustand](/packages/zustand) — apply semantics for patch/replace
- [@statesync/pinia](/packages/pinia) — Pinia-specific behavior
- [Quickstart](/guide/quickstart) — basic wiring with adapters
