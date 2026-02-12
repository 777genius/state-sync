import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface for a Svelte writable store.
 *
 * We intentionally avoid importing `svelte/store` types so this adapter stays
 * dependency-free (from Svelte) and can be used in any environment.
 *
 * The real Svelte writable store implements:
 * - `set(value)` -- replaces the store value entirely
 * - `update(updater)` -- derives the next value from the current one
 * - `subscribe(callback)` -- not needed for applying snapshots
 *
 * Any object that satisfies this shape (e.g. a custom store wrapper) is accepted
 * by {@link createSvelteSnapshotApplier}.
 *
 * @typeParam State - The shape of the store value.
 *
 * @example
 * ```ts
 * import { writable } from 'svelte/store';
 *
 * interface AppState { count: number; name: string }
 * const myStore: SvelteStoreLike<AppState> = writable({ count: 0, name: '' });
 * ```
 */
export interface SvelteStoreLike<State> {
  /**
   * Replaces the store value with the given value, triggering all subscribers.
   *
   * @param value - The new store value.
   */
  set(value: State): void;
  /**
   * Derives the next store value from the current one using the provided updater function.
   *
   * @param updater - A pure function that receives the current value and returns the next value.
   */
  update(updater: (current: State) => State): void;
}

/**
 * Discriminator for the Svelte applier target.
 *
 * - `'store'` -- targets a Svelte 4 writable store via `set()` / `update()`.
 * - `'state'` -- targets a Svelte 5 `$state` rune proxy via in-place property mutation.
 */
export type SvelteTargetKind = 'store' | 'state';

/**
 * Controls how snapshot data is merged into the Svelte target.
 *
 * - `'patch'` (default) -- shallow-merges the mapped data into the current state,
 *   preserving keys not present in the snapshot.
 * - `'replace'` -- replaces the entire state with the mapped data, deleting keys
 *   that are no longer present (respecting `pickKeys` / `omitKeys` filters).
 */
export type SvelteApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for a Svelte **store** snapshot applier.
 *
 * This union type provides correct return-type narrowing for `toState` depending
 * on whether `mode` is `'patch'` (returns `Partial<State>`) or `'replace'`
 * (returns full `State`).
 *
 * @typeParam State - The shape of the Svelte store value. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot maps 1:1 to the store shape.
 */
export type SvelteStoreSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Target kind. Omit or set to `'store'` for Svelte 4 writable stores.
       * @defaultValue `'store'`
       */
      target?: 'store';
      /**
       * Apply mode.
       *
       * - `'patch'` -- shallow-merges mapped data into the current store value.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';
      /**
       * Maps raw snapshot data to a partial state patch.
       *
       * Receives the snapshot payload and a context object containing the target store.
       * Return a partial object whose keys will be shallow-merged into the current value.
       *
       * @defaultValue Identity cast (`data as Partial<State>`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the target store.
       * @returns A partial state object to merge.
       */
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => Partial<State>;
      /**
       * Allow only these top-level keys to be updated by snapshots.
       *
       * Mutually exclusive with `omitKeys`.
       * Use this to protect ephemeral/local-only fields (like UI flags) from being overwritten.
       */
      pickKeys?: ReadonlyArray<keyof State>;
      /**
       * Prevent these top-level keys from being updated by snapshots.
       *
       * Mutually exclusive with `pickKeys`.
       */
      omitKeys?: ReadonlyArray<keyof State>;
      /**
       * When `true`, throws an error if `toState` returns a non-plain-object value.
       * When `false`, silently ignores the invalid return value.
       *
       * @defaultValue `true`
       */
      strict?: boolean;
    }
  | {
      /** Target kind. Omit or set to `'store'` for Svelte 4 writable stores. */
      target?: 'store';
      /**
       * Apply mode.
       *
       * - `'replace'` -- replaces the entire store value atomically, removing keys
       *   not present in the mapped data (respecting key filters).
       */
      mode: 'replace';
      /**
       * Maps raw snapshot data to a full next state.
       *
       * When using `'replace'` mode, prefer returning the complete state to avoid
       * accidentally leaving stale keys.
       *
       * @defaultValue Identity cast (`data as State`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the target store.
       * @returns The full next state.
       */
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => State;
      /** Allow only these top-level keys to be updated by snapshots. Mutually exclusive with `omitKeys`. */
      pickKeys?: ReadonlyArray<keyof State>;
      /** Prevent these top-level keys from being updated by snapshots. Mutually exclusive with `pickKeys`. */
      omitKeys?: ReadonlyArray<keyof State>;
      /**
       * When `true`, throws an error if `toState` returns a non-plain-object value.
       * @defaultValue `true`
       */
      strict?: boolean;
    };

/**
 * Configuration options for a Svelte 5 **$state** snapshot applier.
 *
 * When `target` is `'state'`, the applier mutates the state proxy object in-place
 * (property assignment / `delete`), which is how Svelte 5 fine-grained reactivity
 * tracks changes. No new object reference is created.
 *
 * @typeParam State - The shape of the `$state` proxy object. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot maps 1:1 to the state shape.
 */
export type SvelteStateSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Must be `'state'` to opt into the Svelte 5 `$state` proxy target path.
       */
      target: 'state';
      /**
       * Apply mode.
       *
       * - `'patch'` -- assigns mapped properties onto the existing state proxy.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';
      /**
       * Maps raw snapshot data to a partial state patch.
       *
       * Receives the snapshot payload and a context object containing the current state proxy.
       *
       * @defaultValue Identity cast (`data as Partial<State>`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the current `$state` proxy.
       * @returns A partial state object whose properties will be assigned in-place.
       */
      toState?: (data: Data, ctx: { state: State }) => Partial<State>;
      /** Allow only these top-level keys to be updated by snapshots. Mutually exclusive with `omitKeys`. */
      pickKeys?: ReadonlyArray<keyof State>;
      /** Prevent these top-level keys from being updated by snapshots. Mutually exclusive with `pickKeys`. */
      omitKeys?: ReadonlyArray<keyof State>;
      /**
       * When `true`, throws an error if `toState` returns a non-plain-object value.
       * @defaultValue `true`
       */
      strict?: boolean;
    }
  | {
      /**
       * Must be `'state'` to opt into the Svelte 5 `$state` proxy target path.
       */
      target: 'state';
      /**
       * Apply mode.
       *
       * - `'replace'` -- deletes keys not present in the mapped data, then assigns
       *   the new keys. Keys excluded by `pickKeys` / `omitKeys` are left untouched.
       */
      mode: 'replace';
      /**
       * Maps raw snapshot data to a full next state.
       *
       * When using `'replace'` mode, prefer returning the complete state to avoid
       * accidentally leaving stale keys.
       *
       * @defaultValue Identity cast (`data as State`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the current `$state` proxy.
       * @returns The full next state.
       */
      toState?: (data: Data, ctx: { state: State }) => State;
      /** Allow only these top-level keys to be updated by snapshots. Mutually exclusive with `omitKeys`. */
      pickKeys?: ReadonlyArray<keyof State>;
      /** Prevent these top-level keys from being updated by snapshots. Mutually exclusive with `pickKeys`. */
      omitKeys?: ReadonlyArray<keyof State>;
      /**
       * When `true`, throws an error if `toState` returns a non-plain-object value.
       * @defaultValue `true`
       */
      strict?: boolean;
    };

/**
 * Union of all Svelte snapshot applier option shapes.
 *
 * Discriminated by the `target` field:
 * - `'store'` (or omitted) -- {@link SvelteStoreSnapshotApplierOptions}
 * - `'state'` -- {@link SvelteStateSnapshotApplierOptions}
 *
 * @typeParam State - The shape of the Svelte store or `$state` proxy. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 */
export type SvelteSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | SvelteStoreSnapshotApplierOptions<State, Data>
  | SvelteStateSnapshotApplierOptions<State, Data>;

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
 * Creates a {@link SnapshotApplier} that applies snapshots into a **Svelte 4 writable store**.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events -- those responsibilities belong to the
 * {@link @statesync/core!createRevisionSync | revision sync engine}.
 *
 * **Reactivity:** In `'patch'` mode the applier calls `store.update()` to produce
 * a new object reference (`{ ...current, ...patch }`), which triggers Svelte's
 * store subscription mechanism. In `'replace'` mode the entire value is rebuilt
 * while preserving keys excluded by `pickKeys` / `omitKeys` filters.
 *
 * @typeParam State - The shape of the store value. Must be a plain object.
 * @typeParam Data  - The snapshot payload type. Defaults to `State`.
 *
 * @param store   - A Svelte writable store (or any object satisfying {@link SvelteStoreLike}).
 * @param options - Optional configuration for apply mode, key filtering, and data mapping.
 * @returns A {@link SnapshotApplier} whose `apply()` method updates the store.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example
 * ```ts
 * import { writable } from 'svelte/store';
 * import { createSvelteSnapshotApplier } from '@statesync/svelte';
 * import { createRevisionSync } from '@statesync/core';
 *
 * interface AppState { count: number; name: string }
 *
 * const store = writable<AppState>({ count: 0, name: '' });
 * const applier = createSvelteSnapshotApplier(store);
 *
 * const sync = createRevisionSync({
 *   topic: 'app-state',
 *   subscriber,
 *   provider,
 *   applier,
 * });
 * await sync.start();
 * ```
 */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: SvelteStoreLike<State>,
  options?: SvelteStoreSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Creates a {@link SnapshotApplier} that applies snapshots into a **Svelte 5 `$state` proxy**.
 *
 * Mutates the state object in-place (property assignment / `delete`), which is
 * how Svelte 5 fine-grained reactivity tracks changes. No new object reference
 * is created, so all existing bindings and derived values update automatically.
 *
 * @typeParam State - The shape of the `$state` proxy. Must be a plain object.
 * @typeParam Data  - The snapshot payload type. Defaults to `State`.
 *
 * @param state   - A Svelte 5 `$state()` rune proxy object.
 * @param options - Configuration with `target: 'state'` plus optional mode, key filtering,
 *                  and data mapping.
 * @returns A {@link SnapshotApplier} whose `apply()` method mutates the state proxy in-place.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createSvelteSnapshotApplier } from '@statesync/svelte';
 *   import { createRevisionSync } from '@statesync/core';
 *
 *   interface AppState { count: number; name: string }
 *
 *   let appState = $state<AppState>({ count: 0, name: '' });
 *   const applier = createSvelteSnapshotApplier(appState, { target: 'state' });
 *
 *   const sync = createRevisionSync({
 *     topic: 'app-state',
 *     subscriber,
 *     provider,
 *     applier,
 *   });
 *
 *   $effect(() => {
 *     sync.start();
 *     return () => sync.stop();
 *   });
 * </script>
 *
 * <p>Count: {appState.count}</p>
 * ```
 */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  state: State,
  options: SvelteStateSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/** @internal Implementation overload. */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  storeOrState: SvelteStoreLike<State> | State,
  options: SvelteSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const targetKind: SvelteTargetKind =
    'target' in options && options.target === 'state' ? 'state' : 'store';
  const mode: SvelteApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  if (targetKind === 'state') {
    const state = storeOrState as State;
    const stateOptions = options as SvelteStateSnapshotApplierOptions<State, Data>;
    const toState =
      stateOptions.toState ?? ((data: Data) => data as unknown as Partial<State> | State);

    return {
      apply(snapshot: SnapshotEnvelope<Data>): void {
        const mapped = toState(snapshot.data, { state });

        if (!isPlainObject(mapped)) {
          const message =
            '@statesync/svelte: toState(data) must return a plain object (top-level state)';
          if (strict) throw new Error(message);
          return;
        }

        if (mode === 'replace') {
          const next = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
          const dyn = state as Record<string, unknown>;
          for (const key of Object.keys(state)) {
            if (!allowKey(key as keyof State)) continue;
            if (!(key in next)) {
              delete dyn[key];
            }
          }
          for (const [key, value] of Object.entries(next)) {
            dyn[key] = value;
          }
          return;
        }

        // patch mode: mutate in-place (Svelte 5 $state reactivity)
        const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
        const dyn = state as Record<string, unknown>;
        for (const [key, value] of Object.entries(patch)) {
          dyn[key] = value;
        }
      },
    };
  }

  // store target (default) — Svelte 4 writable stores
  const store = storeOrState as SvelteStoreLike<State>;
  const storeOptions = options as SvelteStoreSnapshotApplierOptions<State, Data>;
  const toState =
    storeOptions.toState ?? ((data: Data) => data as unknown as Partial<State> | State);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/svelte: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);
        store.update((current) => {
          const base: Record<string, unknown> = {};
          for (const key of Object.keys(current as Record<string, unknown>)) {
            if (!allowKey(key as keyof State)) {
              base[key] = (current as Record<string, unknown>)[key];
            }
          }
          for (const [key, value] of Object.entries(next)) {
            base[key] = value;
          }
          return base as State;
        });
        return;
      }

      // patch mode: spread merge creates new reference for Svelte reactivity
      const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
      store.update((current) => ({ ...current, ...patch }));
    },
  };
}
