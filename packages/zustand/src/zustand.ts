import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface that a Zustand store satisfies.
 *
 * We intentionally avoid importing `zustand` types here so this adapter stays
 * dependency-free (from Zustand) and can be used in environments where the
 * `zustand` package is not installed. Any object that structurally matches
 * this interface — including a real `StoreApi` — can be passed to
 * {@link createZustandSnapshotApplier}.
 *
 * The real Zustand store implements at minimum:
 * - `getState()` — returns the current state snapshot
 * - `setState(partial, replace?)` — merges or replaces state
 *
 * @typeParam State - The shape of the Zustand store's state object.
 */
export interface ZustandStoreLike<State extends Record<string, unknown>> {
  /**
   * Returns the current state snapshot of the store.
   *
   * Used by the adapter in `'replace'` mode to read the existing state so
   * that keys excluded by `omitKeys` can be preserved in the rebuilt object.
   *
   * @returns The current state object.
   */
  getState(): State;

  /**
   * Updates the store's state.
   *
   * In `'patch'` mode the adapter calls this with a `Partial<State>` to
   * perform a shallow merge. In `'replace'` mode the adapter calls this
   * with the full rebuilt state and `replace = true` for an atomic swap.
   *
   * @param partial - A full state, partial state, or updater function that
   *   produces a full or partial state from the current state.
   * @param replace - When `true`, replaces the entire state instead of
   *   shallow-merging. Defaults to `false` in Zustand's implementation.
   */
  setState(
    partial: State | Partial<State> | ((state: State) => State | Partial<State>),
    replace?: boolean,
  ): void;
}

/**
 * The strategy used to apply incoming snapshot data to the Zustand store.
 *
 * - `'patch'` — Non-destructive shallow merge via `store.setState(partial)`.
 *   Existing keys not present in the snapshot are left untouched.
 * - `'replace'` — Atomic state swap via `store.setState(nextState, true)`.
 *   The entire state is replaced; keys excluded by `omitKeys` are preserved
 *   by being merged back into the rebuilt object before the swap.
 */
export type ZustandApplyMode = 'patch' | 'replace';

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The shape of the Zustand store's state object.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createZustandSnapshotApplier}.
 *
 * This is a discriminated union on the {@link ZustandApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The shape of the Zustand store's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    store shape directly.
 */
export type ZustandSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * The apply strategy. Defaults to `'patch'`.
       *
       * - `'patch'`: calls `store.setState(partial)` — non-destructive
       *   shallow merge. Existing keys not in the snapshot are preserved.
       * - `'replace'`: calls `store.setState(nextState, true)` — atomic
       *   state swap. The adapter rebuilds the full state by merging
       *   excluded keys from the current state with the incoming snapshot.
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
      toState?: (data: Data, ctx: { store: ZustandStoreLike<State> }) => Partial<State>;

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
       * Use `'replace'` mode for an atomic full-state swap. The adapter reads
       * the current state via `getState()`, preserves keys excluded by filters,
       * and calls `setState(rebuilt, true)`.
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
      toState?: (data: Data, ctx: { store: ZustandStoreLike<State> }) => State;

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
 * Zustand store.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete Zustand state container. It does not fetch snapshots and
 * does not subscribe to invalidation events — those concerns belong to the
 * sync engine (`@statesync/core`).
 *
 * **How state updates propagate:**
 *
 * 1. The sync engine receives an invalidation event and fetches a new
 *    snapshot from the server.
 * 2. The engine calls `applier.apply(envelope)` with the snapshot data.
 * 3. This adapter maps the snapshot data to a state patch (via `toState`),
 *    filters keys (via `pickKeys` / `omitKeys`), and applies the result
 *    to the Zustand store through `setState`.
 * 4. Zustand notifies all subscribers (including React components using the
 *    store hook), triggering re-renders where the selected state has changed.
 *
 * **Framework-specific note:** In `'replace'` mode, the adapter reads the
 * current state via `getState()`, preserves keys excluded by filters, and
 * performs an atomic swap with `setState(rebuilt, true)`. This ensures that
 * omitted keys (e.g., local UI state) survive a full snapshot replacement.
 *
 * @typeParam State - The shape of the Zustand store's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *   Defaults to `State` when the snapshot data matches the store shape
 *   directly.
 *
 * @param store   - The Zustand store (or any object satisfying
 *   {@link ZustandStoreLike}) to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   and strict validation. See {@link ZustandSnapshotApplierOptions}.
 * @returns A {@link SnapshotApplier} whose `apply` method writes snapshot
 *   data into the Zustand store.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a Zustand store (patch mode)
 * ```ts
 * import { create } from 'zustand';
 * import { createZustandSnapshotApplier } from '@statesync/zustand';
 * import { createRevisionSync } from '@statesync/core';
 *
 * interface ProfileState {
 *   name: string;
 *   email: string;
 * }
 *
 * const useProfileStore = create<ProfileState>(() => ({
 *   name: '',
 *   email: '',
 * }));
 *
 * const applier = createZustandSnapshotApplier(useProfileStore);
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
 * const applier = createZustandSnapshotApplier(useProfileStore, {
 *   mode: 'replace',
 *   omitKeys: ['localUiFlag'],
 * });
 * ```
 *
 * @example Custom data mapping
 * ```ts
 * interface ApiResponse { user: { name: string; email: string } }
 *
 * const applier = createZustandSnapshotApplier<ProfileState, ApiResponse>(
 *   useProfileStore,
 *   { toState: (data) => data.user },
 * );
 * ```
 */
export function createZustandSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: ZustandStoreLike<State>,
  options: ZustandSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: ZustandApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/zustand: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);
        const current = store.getState();
        const rebuilt: Record<string, unknown> = {};

        // Keep keys that are omitted (not allowed) from the current state.
        for (const key of Object.keys(current)) {
          if (!allowKey(key as keyof State)) {
            rebuilt[key] = current[key as keyof State];
          }
        }

        // Set allowed keys from the snapshot.
        for (const [key, value] of Object.entries(next)) {
          rebuilt[key] = value;
        }

        store.setState(rebuilt as State, true);
        return;
      }

      const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
      store.setState(patch);
    },
  };
}
