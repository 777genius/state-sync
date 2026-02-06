---
title: React + Zustand
---

# React + Zustand

Complete example of syncing Zustand store across browser tabs.

::: tip
[View source on GitHub](https://github.com/777genius/state-sync/blob/main/docs/examples/react-zustand.ts)
:::

## Use case

Shopping cart that stays in sync across multiple browser tabs. When user adds item in one tab, all other tabs update instantly.

## Store definition

```typescript
// stores/cart.ts
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  // UI state (not synced)
  isLoading: boolean;
  error: string | null;
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  addItem: (item) => {
    const existing = get().items.find((i) => i.id === item.id);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    });
  },

  clearCart: () => set({ items: [] }),
}));
```

## Sync setup

```typescript
// sync/cart-sync.ts
import { createRevisionSync, createConsoleLogger } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import {
  createPersistenceApplier,
  createLocalStorageBackend,
  loadPersistedSnapshot,
} from '@statesync/persistence';
import { useCartStore } from '../stores/cart';

// Revision tracking
let currentRevision = 0;

function getRevision(): string {
  return currentRevision.toString();
}

function incrementRevision(): string {
  currentRevision++;
  localStorage.setItem('cart:revision', currentRevision.toString());
  return currentRevision.toString();
}

// Initialize revision from localStorage
const savedRevision = localStorage.getItem('cart:revision');
if (savedRevision) {
  currentRevision = parseInt(savedRevision, 10);
}

// BroadcastChannel for cross-tab communication
const channel = new BroadcastChannel('cart-sync');

// Subscriber: listen for invalidation events from other tabs
const subscriber = {
  async subscribe(handler: (event: { topic: string; revision: string }) => void) {
    const listener = (e: MessageEvent) => {
      if (e.data?.type === 'invalidation') {
        handler({ topic: e.data.topic, revision: e.data.revision });
      }
    };
    channel.addEventListener('message', listener);
    return () => channel.removeEventListener('message', listener);
  },
};

// Provider: get current cart state
const provider = {
  async getSnapshot() {
    const state = useCartStore.getState();
    return {
      revision: getRevision(),
      data: { items: state.items },
    };
  },
};

// Storage backend for persistence
const storage = createLocalStorageBackend<{ items: CartItem[] }>({
  key: 'cart-state',
});

// Applier with persistence
const innerApplier = createZustandSnapshotApplier(useCartStore, {
  mode: 'patch',
  omitKeys: ['isLoading', 'error', 'addItem', 'removeItem', 'updateQuantity', 'clearCart'],
});

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: { debounceMs: 300 },
  crossTabSync: {
    channelName: 'cart-sync',
    receiveUpdates: true,
    broadcastSaves: true,
  },
});

// Create sync handle
export const cartSync = createRevisionSync({
  topic: 'cart',
  subscriber,
  provider,
  applier,
  logger: createConsoleLogger({ level: 'debug' }),
  onError(ctx) {
    console.error(`Cart sync error [${ctx.phase}]:`, ctx.error);
    useCartStore.setState({ error: `Sync failed: ${ctx.phase}` });
  },
});

// Broadcast changes to other tabs
export function broadcastCartChange() {
  const revision = incrementRevision();
  channel.postMessage({
    type: 'invalidation',
    topic: 'cart',
    revision,
  });
}

// Initialize: load from cache and start sync
export async function initCartSync() {
  // Load cached state first (instant UI)
  const cached = await loadPersistedSnapshot(storage, innerApplier);
  if (cached) {
    console.log('Restored cart from cache, revision:', cached.revision);
  }

  // Start real-time sync
  await cartSync.start();
}

// Cleanup
export function stopCartSync() {
  cartSync.stop();
  channel.close();
}
```

## React hooks

```typescript
// hooks/useCartSync.ts
import { useEffect } from 'react';
import { initCartSync, stopCartSync, broadcastCartChange } from '../sync/cart-sync';
import { useCartStore } from '../stores/cart';

export function useCartSync() {
  useEffect(() => {
    initCartSync();
    return () => stopCartSync();
  }, []);
}

export function useCart() {
  const { items, isLoading, error, addItem, removeItem, updateQuantity, clearCart } =
    useCartStore();

  // Wrap actions to broadcast changes
  const addItemAndSync = (item: Parameters<typeof addItem>[0]) => {
    addItem(item);
    broadcastCartChange();
  };

  const removeItemAndSync = (id: string) => {
    removeItem(id);
    broadcastCartChange();
  };

  const updateQuantityAndSync = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
    broadcastCartChange();
  };

  const clearCartAndSync = () => {
    clearCart();
    broadcastCartChange();
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    isLoading,
    error,
    total,
    itemCount,
    addItem: addItemAndSync,
    removeItem: removeItemAndSync,
    updateQuantity: updateQuantityAndSync,
    clearCart: clearCartAndSync,
  };
}
```

## Components

```tsx
// components/Cart.tsx
import { useCart, useCartSync } from '../hooks/useCartSync';

export function CartProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

export function Cart() {
  const { items, total, itemCount, removeItem, updateQuantity, clearCart, error } = useCart();

  if (error) {
    return <div className="error">Sync error: {error}</div>;
  }

  return (
    <div className="cart">
      <h2>Cart ({itemCount} items)</h2>

      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                />
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div className="total">
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>

          <button onClick={clearCart}>Clear Cart</button>
        </>
      )}
    </div>
  );
}

export function AddToCartButton({ product }: { product: { id: string; name: string; price: number } }) {
  const { addItem } = useCart();

  return (
    <button onClick={() => addItem(product)}>
      Add to Cart
    </button>
  );
}
```

## App entry

```tsx
// App.tsx
import { CartProvider, Cart, AddToCartButton } from './components/Cart';

const products = [
  { id: '1', name: 'Widget', price: 9.99 },
  { id: '2', name: 'Gadget', price: 19.99 },
  { id: '3', name: 'Gizmo', price: 29.99 },
];

export default function App() {
  return (
    <CartProvider>
      <div className="app">
        <h1>Shop</h1>

        <div className="products">
          {products.map((product) => (
            <div key={product.id} className="product">
              <h3>{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
              <AddToCartButton product={product} />
            </div>
          ))}
        </div>

        <Cart />
      </div>
    </CartProvider>
  );
}
```

## Testing

Open your app in two browser tabs. Add items in one tab — they appear in the other tab instantly.

```
Tab 1: Add "Widget" to cart
Tab 2: Cart updates automatically (Widget x1)

Tab 2: Add "Gadget" to cart
Tab 1: Cart updates automatically (Widget x1, Gadget x1)

Close Tab 1, reopen
Tab 1: Cart restored from localStorage (Widget x1, Gadget x1)
```

## Key points

1. **UI state excluded**: `isLoading`, `error`, and action functions are not synced via `omitKeys`

2. **Persistence**: Cart persists to localStorage, survives page refresh

3. **Cross-tab sync**: BroadcastChannel notifies other tabs of changes

4. **Revision tracking**: Prevents stale updates from overwriting newer data

5. **Instant UI**: Cache loads before sync starts for immediate feedback
