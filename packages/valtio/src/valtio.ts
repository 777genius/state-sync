import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Structural type alias representing a Valtio proxy object.
 *
 * In Valtio, the "store" is simply a mutable proxy created with
 * `proxy({ ... })`. Unlike Pinia or Zustand there is no wrapper API — the
 * proxy **is** the state object. This type alias makes that semantic explicit
 * while keeping the adapter dependency-free from the `valtio` package.
 *
 * Any plain object whose shape matches `State` can be used, including a real
 * Valtio proxy returned by `proxy()`.
 *
 * @typeParam State - The shape of the proxy's state object.
 */
export type ValtioProxyLike<State extends Record<string, unknown>> = State;

/**
 * The strategy used to apply incoming snapshot data to the Valtio proxy.
 *
 * - `'patch'` — Iterates filtered keys and assigns them directly on the
 *   proxy (`proxy[key] = value`). Existing keys not present in the snapshot
 *   are left untouched. Valtio's reactivity tracks each property mutation.
 * - `'replace'` — First deletes allowed keys not present in the new state,
 *   then assigns keys from the new state. The proxy reference remains the
 *   same, so existing `useSnapshot()` / `subscribe()` consumers continue
 *   to work without re-wiring.
 */
export type ValtioApplyMode = 'patch' | 'replace';

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The shape of the proxy's state object.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createValtioSnapshotApplier}.
 *
 * This is a discriminated union on the {@link ValtioApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The shape of the Valtio proxy's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    proxy shape directly.
 */
export type ValtioSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * The apply strategy. Defaults to `'patch'`.
       *
       * - `'patch'`: iterates filtered keys and assigns each one directly
       *   on the proxy (`proxy[key] = value`). Keys not in the snapshot are
       *   left untouched.
       * - `'replace'`: first deletes allowed keys not present in the new
       *   state, then assigns keys present in the new state. The proxy
       *   reference remains the same throughout.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';

      /**
       * Maps raw snapshot data to a state patch object.
       *
       * Use this when the snapshot payload shape differs from the proxy state
       * shape, or when you need to derive state from the payload plus current
       * proxy state.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target proxy.
       * @returns A partial state object whose keys will be assigned to the
       *   proxy.
       *
       * @defaultValue Identity cast — treats `data` as `Partial<State>`.
       */
      toState?: (data: Data, ctx: { proxy: ValtioProxyLike<State> }) => Partial<State>;

      /**
       * An allowlist of top-level state keys that the applier is permitted to
       * update. All other keys are left untouched.
       *
       * Mutually exclusive with {@link omitKeys}.
       *
       * Use this to keep ephemeral or local-only fields (such as UI flags)
       * isolated from remote synchronization.
       */
      pickKeys?: ReadonlyArray<keyof State>;

      /**
       * A denylist of top-level state keys that the applier must never update.
       * All other keys are eligible for synchronization.
       *
       * Mutually exclusive with {@link pickKeys}.
       */
      omitKeys?: ReadonlyArray<keyof State>;

      /**
       * When `true`, the applier throws if `toState` returns a non-plain-object
       * value (e.g., `null`, an array, or a primitive). When `false`, such
       * values are silently ignored.
       *
       * @defaultValue `true`
       */
      strict?: boolean;
    }
  | {
      /**
       * Use `'replace'` mode for a full top-level state swap on the proxy.
       * Allowed keys not present in the incoming snapshot are deleted; the
       * proxy reference itself is never replaced.
       */
      mode: 'replace';

      /**
       * Maps raw snapshot data to the full next state.
       *
       * When using `'replace'` mode, prefer returning the complete state
       * object to avoid accidentally leaving stale keys behind.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target proxy.
       * @returns The full next state to apply onto the proxy.
       *
       * @defaultValue Identity cast — treats `data` as `State`.
       */
      toState?: (data: Data, ctx: { proxy: ValtioProxyLike<State> }) => State;

      /**
       * An allowlist of top-level state keys that the applier is permitted to
       * update. All other keys are left untouched.
       *
       * Mutually exclusive with {@link omitKeys}.
       */
      pickKeys?: ReadonlyArray<keyof State>;

      /**
       * A denylist of top-level state keys that the applier must never update.
       * All other keys are eligible for synchronization.
       *
       * Mutually exclusive with {@link pickKeys}.
       */
      omitKeys?: ReadonlyArray<keyof State>;

      /**
       * When `true`, the applier throws if `toState` returns a non-plain-object
       * value. When `false`, such values are silently ignored.
       *
       * @defaultValue `true`
       */
      strict?: boolean;
    };

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value)) return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

function makeKeyFilter<State extends Record<string, unknown>>(
  options: PickOrOmitKeys<State>,
): (key: keyof State) => boolean {
  if ('pickKeys' in options && options.pickKeys) {
    const set = new Set<keyof State>(options.pickKeys);
    return (k) => set.has(k);
  }
  if ('omitKeys' in options && options.omitKeys) {
    const set = new Set<keyof State>(options.omitKeys);
    return (k) => !set.has(k);
  }
  return () => true;
}

function filterTopLevelKeys<State extends Record<string, unknown>>(
  obj: Record<string, unknown>,
  allowKey: (k: keyof State) => boolean,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (allowKey(k as keyof State)) out[k] = v;
  }
  return out;
}

/**
 * Creates a {@link SnapshotApplier} that applies incoming snapshots into a
 * Valtio proxy.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete Valtio state container. It does not fetch snapshots and
 * does not subscribe to invalidation events — those concerns belong to the
 * sync engine (`@statesync/core`).
 *
 * **How state updates propagate:**
 *
 * 1. The sync engine receives an invalidation event and fetches a new
 *    snapshot from the server.
 * 2. The engine calls `applier.apply(envelope)` with the snapshot data.
 * 3. This adapter maps the snapshot data to a state patch (via `toState`),
 *    filters keys (via `pickKeys` / `omitKeys`), and mutates the Valtio
 *    proxy in place by assigning or deleting individual properties.
 * 4. Valtio's proxy tracking automatically notifies all subscribers
 *    (including React components using `useSnapshot(proxy)`) of the
 *    changed properties, triggering granular re-renders.
 *
 * **Framework-specific note:** The proxy reference is **never replaced**.
 * All mutations are applied directly to the existing proxy object so that
 * `useSnapshot()`, `subscribe()`, and `watch()` consumers continue to work
 * without any re-wiring. This is the key difference from the Zustand adapter
 * (which swaps the entire state object in `'replace'` mode) and the Pinia
 * adapter (which uses `$patch`).
 *
 * @typeParam State - The shape of the Valtio proxy's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *   Defaults to `State` when the snapshot data matches the proxy shape
 *   directly.
 *
 * @param proxy   - The Valtio proxy (or any object satisfying
 *   {@link ValtioProxyLike}) to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   and strict validation. See {@link ValtioSnapshotApplierOptions}.
 * @returns A {@link SnapshotApplier} whose `apply` method writes snapshot
 *   data into the Valtio proxy.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a Valtio proxy (patch mode)
 * ```ts
 * import { proxy } from 'valtio';
 * import { createValtioSnapshotApplier } from '@statesync/valtio';
 * import { createRevisionSync } from '@statesync/core';
 *
 * interface ProfileState {
 *   name: string;
 *   email: string;
 * }
 *
 * const profileProxy = proxy<ProfileState>({ name: '', email: '' });
 * const applier = createValtioSnapshotApplier(profileProxy);
 *
 * // Wire into the sync engine:
 * const sync = createRevisionSync({
 *   topic: 'user-profile',
 *   subscriber: mySubscriber,
 *   provider: mySnapshotProvider,
 *   applier,
 * });
 * ```
 *
 * @example Using in a React component with useSnapshot
 * ```tsx
 * import { useSnapshot } from 'valtio';
 *
 * function ProfileCard() {
 *   const snap = useSnapshot(profileProxy);
 *   return <div>{snap.name} — {snap.email}</div>;
 * }
 * // When the sync engine applies a new snapshot, the component
 * // automatically re-renders with the updated values.
 * ```
 *
 * @example Replace mode with key filtering
 * ```ts
 * const applier = createValtioSnapshotApplier(profileProxy, {
 *   mode: 'replace',
 *   omitKeys: ['localUiFlag'],
 * });
 * ```
 *
 * @example Custom data mapping
 * ```ts
 * interface ApiResponse { user: { name: string; email: string } }
 *
 * const applier = createValtioSnapshotApplier<ProfileState, ApiResponse>(
 *   profileProxy,
 *   { toState: (data) => data.user },
 * );
 * ```
 */
export function createValtioSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  proxy: ValtioProxyLike<State>,
  options: ValtioSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: ValtioApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { proxy });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/valtio: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);

        // Delete keys not present in next state (top-level only).
        for (const key of Object.keys(proxy)) {
          const k = key as keyof State;
          if (!allowKey(k)) continue;
          if (!(key in next)) {
            delete (proxy as Record<string, unknown>)[key];
          }
        }

        // Assign keys present in next state.
        for (const [key, value] of Object.entries(next)) {
          (proxy as Record<string, unknown>)[key] = value;
        }
        return;
      }

      // patch mode: assign filtered keys directly on the proxy.
      const patch = filterTopLevelKeys<State>(mapped, allowKey);
      for (const [key, value] of Object.entries(patch)) {
        (proxy as Record<string, unknown>)[key] = value;
      }
    },
  };
}
