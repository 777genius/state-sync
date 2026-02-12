import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface that a Jotai store satisfies.
 *
 * We intentionally avoid importing `jotai` types here so this adapter stays
 * dependency-free and can be used in environments where the `jotai` package
 * is not installed. Any object that structurally matches this interface —
 * including a real store from `createStore()` — can be passed to
 * {@link createJotaiSnapshotApplier}.
 *
 * @typeParam State - The value type held by the target atom.
 * @typeParam Atom  - The atom reference type (opaque to the adapter).
 */
export interface JotaiStoreLike<State, Atom> {
  /**
   * Returns the current value of the given atom.
   *
   * Used in `'replace'` mode to read existing state so that keys excluded
   * by `omitKeys` can be preserved.
   *
   * @param atom - The atom to read.
   * @returns The current value of the atom.
   */
  get(atom: Atom): State;

  /**
   * Sets the atom's value. Accepts either a direct value or an updater
   * function that receives the previous value and returns the next value.
   *
   * The adapter uses the updater form for atomic read-modify-write
   * operations (patch mode and replace mode with `omitKeys`).
   *
   * @param atom  - The atom to write.
   * @param value - The next value, or an updater function `(prev) => next`.
   */
  set(atom: Atom, value: State | ((prev: State) => State)): void;
}

/**
 * The strategy used to apply incoming snapshot data to the Jotai atom.
 *
 * - `'patch'` — Non-destructive shallow merge. The adapter uses the store's
 *   updater form `store.set(atom, prev => ({ ...prev, ...patch }))` to
 *   atomically merge the filtered snapshot keys into the current atom value.
 *   Existing keys not present in the snapshot are left untouched.
 * - `'replace'` — Atomic value swap. The adapter rebuilds the full state,
 *   preserving keys excluded by `omitKeys`, and writes it via
 *   `store.set(atom, next)`.
 */
export type JotaiApplyMode = 'patch' | 'replace';

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The value type of the atom.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createJotaiSnapshotApplier}.
 *
 * This is a discriminated union on the {@link JotaiApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The value type of the atom.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    atom value shape directly.
 */
export type JotaiSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
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
       * @param ctx  - Context object providing access to the target store
       *   and atom.
       * @returns A partial state object to be shallow-merged into the atom.
       *
       * @defaultValue Identity cast — treats `data` as `Partial<State>`.
       */
      toState?: (
        data: Data,
        ctx: { store: JotaiStoreLike<State, unknown>; atom: unknown },
      ) => Partial<State>;

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
       * Use `'replace'` mode for an atomic full-state swap.
       */
      mode: 'replace';

      /**
       * Maps raw snapshot data to the full next state.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store
       *   and atom.
       * @returns The full next state to replace the current atom value with.
       *
       * @defaultValue Identity cast — treats `data` as `State`.
       */
      toState?: (
        data: Data,
        ctx: { store: JotaiStoreLike<State, unknown>; atom: unknown },
      ) => State;

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
 * Jotai atom via a Jotai store.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete Jotai atom. It does not fetch snapshots and does not
 * subscribe to invalidation events — those concerns belong to the sync
 * engine (`@statesync/core`).
 *
 * **Key difference from other adapters:** Jotai stores state in individual
 * atoms rather than a single store object. This adapter requires both a
 * store reference AND the target atom. The store's `get` and `set` methods
 * are used to read and write the atom's value. The adapter uses the updater
 * form of `store.set` for atomic read-modify-write operations, avoiding
 * race conditions between `get` and `set`.
 *
 * @typeParam State - The shape of the atom's value (must be a plain object).
 * @typeParam Data  - The snapshot payload type. Defaults to `State`.
 * @typeParam Atom  - The atom reference type.
 *
 * @param store   - The Jotai store (or any object satisfying
 *   {@link JotaiStoreLike}).
 * @param atom    - The target atom to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   and strict validation.
 * @returns A {@link SnapshotApplier} whose `apply` method writes snapshot
 *   data into the Jotai atom.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a Jotai store (patch mode)
 * ```ts
 * import { atom, createStore } from 'jotai/vanilla';
 * import { createJotaiSnapshotApplier } from '@statesync/jotai';
 * import { createRevisionSync } from '@statesync/core';
 *
 * const store = createStore();
 * const profileAtom = atom({ name: '', email: '' });
 *
 * const applier = createJotaiSnapshotApplier(store, profileAtom);
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
 * const applier = createJotaiSnapshotApplier(store, settingsAtom, {
 *   mode: 'replace',
 *   omitKeys: ['isMenuOpen'],
 * });
 * ```
 *
 * @example Custom data mapping
 * ```ts
 * interface ApiResponse { user: { name: string; email: string } }
 *
 * const applier = createJotaiSnapshotApplier<ProfileState, ApiResponse>(
 *   store,
 *   profileAtom,
 *   { toState: (data) => data.user },
 * );
 * ```
 */
export function createJotaiSnapshotApplier<
  State extends Record<string, unknown>,
  Data = State,
  Atom = unknown,
>(
  store: JotaiStoreLike<State, Atom>,
  atom: Atom,
  options: JotaiSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: JotaiApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store, atom });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/jotai: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);

        // Use updater form for atomic read-modify-write.
        store.set(atom, (prev: State) => {
          const rebuilt: Record<string, unknown> = {};

          // Preserve keys excluded by filters from current state.
          for (const key of Object.keys(prev)) {
            if (!allowKey(key as keyof State)) {
              rebuilt[key] = prev[key as keyof State];
            }
          }

          // Set allowed keys from the snapshot.
          for (const [key, value] of Object.entries(next)) {
            rebuilt[key] = value;
          }

          return rebuilt as State;
        });
        return;
      }

      // patch mode: use updater form for atomic merge.
      const patch = filterTopLevelKeys<State>(mapped, allowKey);
      store.set(atom, (prev: State) => ({ ...prev, ...patch }) as State);
    },
  };
}
