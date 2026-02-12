import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Structural type alias representing a MobX observable object.
 *
 * In MobX, a "store" is typically a class instance with properties marked
 * as `observable` via `makeObservable` / `makeAutoObservable`, or a plain
 * object wrapped with `observable()`. This type alias makes that semantic
 * explicit while keeping the adapter dependency-free from the `mobx` package.
 *
 * Any object whose shape matches `State` can be used, including a real MobX
 * observable created with `observable()` or a class instance using
 * `makeAutoObservable(this)`.
 *
 * @typeParam State - The shape of the observable store's state object.
 */
export type MobXStoreLike<State extends Record<string, unknown>> = State;

/**
 * The strategy used to apply incoming snapshot data to the MobX store.
 *
 * - `'patch'` — Iterates filtered keys and assigns them directly on the
 *   observable (`store[key] = value`). Existing keys not present in the
 *   snapshot are left untouched. MobX's reactivity tracks each property
 *   mutation.
 * - `'replace'` — First deletes allowed keys not present in the new state,
 *   then assigns keys from the new state. The observable reference remains
 *   the same, so existing `autorun` / `reaction` / `observer` consumers
 *   continue to work without re-wiring.
 */
export type MobXApplyMode = 'patch' | 'replace';

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The shape of the observable store's state object.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createMobXSnapshotApplier}.
 *
 * This is a discriminated union on the {@link MobXApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The shape of the MobX observable's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    store shape directly.
 */
export type MobXSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * The apply strategy. Defaults to `'patch'`.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';

      /**
       * Maps raw snapshot data to a state patch object.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store.
       * @returns A partial state object whose keys will be assigned to the
       *   store.
       *
       * @defaultValue Identity cast — treats `data` as `Partial<State>`.
       */
      toState?: (data: Data, ctx: { store: MobXStoreLike<State> }) => Partial<State>;

      /**
       * A function that wraps state mutations in a MobX action/transaction.
       *
       * Pass `runInAction` from `mobx` here to ensure the adapter works
       * correctly with `enforceActions: 'always'` or `'observed'` (the
       * recommended defaults). All property assignments happen inside a
       * single call, so MobX batches updates and triggers reactions once.
       *
       * When omitted, the adapter assigns keys directly on the observable.
       * This works when `enforceActions` is `'never'`, but will throw at
       * runtime if MobX strict mode is enabled and the store has active
       * observers.
       *
       * @example
       * ```ts
       * import { runInAction } from 'mobx';
       * const applier = createMobXSnapshotApplier(store, { runInAction });
       * ```
       *
       * @defaultValue `undefined` — mutations are applied without wrapping.
       */
      runInAction?: (fn: () => void) => void;

      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;

      /**
       * When `true`, the applier throws if `toState` returns a non-plain-object
       * value. When `false`, such values are silently ignored.
       *
       * @defaultValue `true`
       */
      strict?: boolean;
    }
  | {
      /**
       * Use `'replace'` mode for a full top-level state swap on the
       * observable. Allowed keys not present in the incoming snapshot are
       * deleted; the store reference itself is never replaced.
       */
      mode: 'replace';

      /**
       * Maps raw snapshot data to the full next state.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store.
       * @returns The full next state to apply onto the store.
       *
       * @defaultValue Identity cast — treats `data` as `State`.
       */
      toState?: (data: Data, ctx: { store: MobXStoreLike<State> }) => State;

      /** @see MobXSnapshotApplierOptions */
      runInAction?: (fn: () => void) => void;

      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;

      /**
       * When `true`, the applier throws if `toState` returns a non-plain-object
       * value. When `false`, such values are silently ignored.
       *
       * @defaultValue `true`
       */
      strict?: boolean;
    };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a {@link SnapshotApplier} that applies incoming snapshots into a
 * MobX observable store by mutating it in place.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete MobX state container. It does not fetch snapshots and does
 * not subscribe to invalidation events — those concerns belong to the sync
 * engine (`@statesync/core`).
 *
 * **How state updates propagate:**
 *
 * 1. The sync engine receives an invalidation event and fetches a new
 *    snapshot from the server.
 * 2. The engine calls `applier.apply(envelope)` with the snapshot data.
 * 3. This adapter maps the snapshot data to a state patch (via `toState`),
 *    filters keys (via `pickKeys` / `omitKeys`), and mutates the MobX
 *    observable in place by assigning or deleting individual properties
 *    inside a single `runInAction` call (when provided).
 * 4. MobX's reactivity system automatically notifies all subscribers
 *    (`autorun`, `reaction`, `observer()`) of the changed properties.
 *
 * **Framework-specific note:** The store reference is **never replaced**.
 * All mutations are applied directly to the existing observable object so
 * that `autorun`, `reaction`, and `observer()` consumers continue to work
 * without any re-wiring.
 *
 * @typeParam State - The shape of the MobX observable's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *   Defaults to `State` when the snapshot data matches the store shape.
 *
 * @param store   - The MobX observable (or any object satisfying
 *   {@link MobXStoreLike}) to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   `runInAction` wrapping, and strict validation.
 * @returns A {@link SnapshotApplier} whose `apply` method writes snapshot
 *   data into the MobX store.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a MobX observable (patch mode)
 * ```ts
 * import { makeAutoObservable, runInAction } from 'mobx';
 * import { createMobXSnapshotApplier } from '@statesync/mobx';
 * import { createRevisionSync } from '@statesync/core';
 *
 * class ProfileStore {
 *   name = '';
 *   email = '';
 *   constructor() { makeAutoObservable(this); }
 * }
 *
 * const store = new ProfileStore();
 * const applier = createMobXSnapshotApplier(store, { runInAction });
 *
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
 * const applier = createMobXSnapshotApplier(store, {
 *   mode: 'replace',
 *   runInAction,
 *   omitKeys: ['isMenuOpen'],
 * });
 * ```
 */
export function createMobXSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: MobXStoreLike<State>,
  options: MobXSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: MobXApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;
  const userRunInAction = options.runInAction;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  const wrapAction: (fn: () => void) => void = userRunInAction ?? ((fn) => fn());

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/mobx: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      wrapAction(() => {
        if (mode === 'replace') {
          const next = filterTopLevelKeys<State>(mapped, allowKey);

          // Delete keys not present in next state (top-level only).
          for (const key of Object.keys(store)) {
            const k = key as keyof State;
            if (!allowKey(k)) continue;
            if (!(key in next)) {
              delete (store as Record<string, unknown>)[key];
            }
          }

          // Assign keys present in next state.
          for (const [key, value] of Object.entries(next)) {
            (store as Record<string, unknown>)[key] = value;
          }
          return;
        }

        // patch mode: assign filtered keys directly on the store.
        const patch = filterTopLevelKeys<State>(mapped, allowKey);
        for (const [key, value] of Object.entries(patch)) {
          (store as Record<string, unknown>)[key] = value;
        }
      });
    },
  };
}
