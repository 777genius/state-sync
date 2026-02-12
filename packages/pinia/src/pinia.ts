import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface that a Pinia store satisfies.
 *
 * We intentionally avoid importing `pinia` types here so this adapter stays
 * dependency-free (from Pinia) and can be used in environments where the
 * `pinia` package is not installed. Any object that structurally matches this
 * interface — including a real `StoreGeneric` — can be passed to
 * {@link createPiniaSnapshotApplier}.
 *
 * The real Pinia store implements at minimum:
 * - `$state` — reactive state object
 * - `$patch(partial | mutator)` — the preferred way to batch-update state
 *
 * @typeParam State - The shape of the store's reactive state object.
 */
export interface PiniaStoreLike<State extends Record<string, unknown>> {
  /**
   * Optional store identifier exposed by Pinia as `$id`.
   *
   * Not used by the adapter at runtime; included for debugging and logging
   * convenience.
   */
  $id?: string;

  /**
   * The current reactive state of the store.
   *
   * Read by the adapter in `'replace'` mode to determine which keys need to
   * be deleted when the incoming snapshot no longer contains them.
   */
  $state: State;

  /**
   * Applies a partial state update or a mutator function to the store.
   *
   * In `'patch'` mode the adapter passes a plain partial object.
   * In `'replace'` mode the adapter passes a mutator callback that deletes
   * stale keys and assigns new ones.
   *
   * @param patch - Either a `Partial<State>` object whose keys will be
   *   shallowly merged into the store, or a mutator function that receives
   *   the current state and may mutate it directly.
   */
  $patch(patch: Partial<State> | ((state: State) => void)): void;
}

/**
 * The strategy used to apply incoming snapshot data to the Pinia store.
 *
 * - `'patch'` — Non-destructive shallow merge via `store.$patch(partial)`.
 *   Existing keys not present in the snapshot are left untouched.
 * - `'replace'` — Full top-level replacement via a `$patch` mutator callback.
 *   Keys present in the store but absent from the snapshot are deleted.
 */
export type PiniaApplyMode = 'patch' | 'replace';

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The shape of the store's reactive state object.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createPiniaSnapshotApplier}.
 *
 * This is a discriminated union on the {@link PiniaApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The shape of the Pinia store's reactive state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    store shape directly.
 */
export type PiniaSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * The apply strategy. Defaults to `'patch'`.
       *
       * - `'patch'`: calls `store.$patch(partial)` — non-destructive shallow
       *   merge. Existing keys not present in the snapshot are left untouched.
       * - `'replace'`: applies a top-level replacement using
       *   `$patch((state) => ...)`:
       *   - deletes keys not present in `nextState`
       *   - assigns keys present in `nextState`
       *
       * Why not `store.$state = nextState`?
       * Pinia documents that assigning `$state` internally calls `$patch()`,
       * so it does not reliably remove stale keys on its own.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';

      /**
       * Maps raw snapshot data to a state patch object.
       *
       * Use this when the snapshot payload shape differs from the store state
       * shape, or when you need to derive state from the payload plus current
       * store state.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store.
       * @returns A partial state object to be shallow-merged into the store.
       *
       * @defaultValue Identity cast — treats `data` as `Partial<State>`.
       */
      toState?: (data: Data, ctx: { store: PiniaStoreLike<State> }) => Partial<State>;

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
       * Use `'replace'` mode for a full top-level state swap. Keys in the
       * store that are not present in the incoming snapshot will be deleted
       * (subject to key filtering).
       */
      mode: 'replace';

      /**
       * Maps raw snapshot data to the full next state.
       *
       * When using `'replace'` mode, prefer returning the complete state
       * object to avoid accidentally leaving stale keys behind.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store.
       * @returns The full next state to replace the current store state with.
       *
       * @defaultValue Identity cast — treats `data` as `State`.
       */
      toState?: (data: Data, ctx: { store: PiniaStoreLike<State> }) => State;

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
 * Pinia store.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete Pinia state container. It does not fetch snapshots and does
 * not subscribe to invalidation events — those concerns belong to the sync
 * engine (`@statesync/core`).
 *
 * **How state updates propagate:**
 *
 * 1. The sync engine receives an invalidation event and fetches a new
 *    snapshot from the server.
 * 2. The engine calls `applier.apply(envelope)` with the snapshot data.
 * 3. This adapter maps the snapshot data to a state patch (via `toState`),
 *    filters keys (via `pickKeys` / `omitKeys`), and applies the result
 *    to the Pinia store through `$patch`.
 * 4. Vue's reactivity system automatically re-renders any components that
 *    depend on the updated state.
 *
 * @typeParam State - The shape of the Pinia store's reactive state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *   Defaults to `State` when the snapshot data matches the store shape
 *   directly.
 *
 * @param store   - The Pinia store (or any object satisfying
 *   {@link PiniaStoreLike}) to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   and strict validation. See {@link PiniaSnapshotApplierOptions}.
 * @returns A {@link SnapshotApplier} whose `apply` method writes snapshot
 *   data into the Pinia store.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a Pinia store (patch mode)
 * ```ts
 * import { defineStore } from 'pinia';
 * import { createPiniaSnapshotApplier } from '@statesync/pinia';
 * import { createRevisionSync } from '@statesync/core';
 *
 * const useProfileStore = defineStore('profile', {
 *   state: () => ({ name: '', email: '', age: 0 }),
 * });
 *
 * const store = useProfileStore();
 * const applier = createPiniaSnapshotApplier(store);
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
 * @example Replace mode with key filtering
 * ```ts
 * const applier = createPiniaSnapshotApplier(store, {
 *   mode: 'replace',
 *   omitKeys: ['localUiFlag'],
 * });
 * ```
 *
 * @example Custom data mapping
 * ```ts
 * interface ApiResponse { user: { name: string; email: string } }
 *
 * const applier = createPiniaSnapshotApplier<ProfileState, ApiResponse>(store, {
 *   toState: (data) => data.user,
 * });
 * ```
 */
export function createPiniaSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: PiniaStoreLike<State>,
  options: PiniaSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: PiniaApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/pinia: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
        store.$patch((state) => {
          const dyn = state as unknown as Record<string, unknown>;
          // Delete keys not present in next state (top-level only).
          for (const key of Object.keys(state)) {
            const k = key as keyof State;
            if (!allowKey(k)) continue;
            if (!(key in next)) {
              // Deleting top-level keys is safe in Vue 3 reactivity.
              delete dyn[key];
            }
          }
          // Assign keys present in next state.
          for (const [key, value] of Object.entries(next)) {
            dyn[key] = value;
          }
        });
        return;
      }

      const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
      store.$patch(patch);
    },
  };
}
