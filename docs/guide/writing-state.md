---
title: Writing state
---

# Writing state

state-sync handles the **read** path: backend → all windows. Your app handles the **write** path: UI → backend.

```
User clicks → your code sends update → backend saves → emits invalidation → state-sync delivers to all windows
```

## Which pattern to use?

| Pattern | When to use | Backend needed? |
|---------|-------------|-----------------|
| [Backend write](#backend-write) | Tauri, Electron, API server | Yes |
| [Optimistic + broadcast](#optimistic-broadcast) | Browser tabs only, no backend | No |
| [Optimistic + confirm](#optimistic-confirm) | API server with fast feedback | Yes |

## Backend write {#backend-write}

Send change to backend. Backend updates state, increments revision, emits invalidation. state-sync picks it up automatically.

```typescript
// Frontend: send update
await invoke('update_settings', { settings: { theme: 'dark' } });
// Backend: saves, bumps revision, emits 'settings:invalidated'
// state-sync: receives event, fetches snapshot, applies to all windows
```

This is the simplest and most reliable pattern. The backend is always the source of truth.

## Optimistic + broadcast {#optimistic-broadcast}

Update local state immediately, then notify other tabs via BroadcastChannel. No backend involved.

```typescript
import { useCartStore } from './stores/cart';

const channel = new BroadcastChannel('cart-sync');
let revision = parseInt(localStorage.getItem('cart:rev') || '0');

function addItem(item) {
  // 1. Update local state immediately
  useCartStore.getState().addItem(item);

  // 2. Bump revision and persist
  revision++;
  localStorage.setItem('cart:rev', String(revision));
  localStorage.setItem('cart:data', JSON.stringify(useCartStore.getState()));

  // 3. Notify other tabs
  channel.postMessage({ topic: 'cart', revision: String(revision) });
}
```

::: warning
Without a backend, there is no conflict resolution. If two tabs write simultaneously, the last write wins.
:::

## Optimistic + confirm {#optimistic-confirm}

Update UI immediately for responsiveness. Then send to backend. If backend rejects, revert.

```typescript
async function updateTheme(newTheme: string) {
  const store = useSettingsStore();
  const previousTheme = store.theme;

  // 1. Optimistic update
  store.theme = newTheme;

  try {
    // 2. Send to backend
    await fetch('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ theme: newTheme }),
    });
    // Backend emits invalidation → state-sync syncs all windows
  } catch (error) {
    // 3. Revert on failure
    store.theme = previousTheme;
  }
}
```

## Anti-pattern: mutate without invalidation

```typescript
// ❌ Bad: other windows never learn about this change
store.theme = 'dark';

// ✅ Good: other windows get the update via state-sync
await invoke('update_settings', { settings: { theme: 'dark' } });
```

State changes that bypass the backend (or BroadcastChannel) will not propagate to other windows.

## See also

- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
- [Vue + Pinia + Tauri example](/examples/vue-pinia-tauri) — backend write in practice
- [React + Zustand example](/examples/react-zustand) — optimistic + broadcast in practice
