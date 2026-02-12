import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface for a Vue ref-like container.
 *
 * Compatible with `Ref<T>`, `ShallowRef<T>`, or any object with a `.value`
 * property of type `State`. We intentionally avoid importing Vue types so
 * this adapter stays dependency-free and can be used in any environment.
 *
 * @typeParam State - The shape of the ref's inner value.
 *
 * @example
 * ```ts
 * import { ref } from 'vue';
 *
 * interface AppState { count: number; name: string }
 * const myRef: VueRefLike<AppState> = ref({ count: 0, name: '' });
 * ```
 */
export interface VueRefLike<State> {
  /**
   * The unwrapped value held by the ref.
   *
   * Assigning to this property triggers Vue's reactivity tracking so that
   * any watchers, computed properties, or template bindings that depend on
   * this ref are re-evaluated.
   */
  value: State;
}

/**
 * Discriminator for the Vue applier target.
 *
 * - `'reactive'` -- targets a Vue `reactive()` proxy via in-place property mutation.
 * - `'ref'` -- targets a Vue `ref()` or `shallowRef()` container via `.value` replacement.
 */
export type VueTargetKind = 'ref' | 'reactive';

/**
 * Controls how snapshot data is merged into the Vue target.
 *
 * - `'patch'` (default) -- shallow-merges the mapped data into the current state,
 *   preserving keys not present in the snapshot.
 * - `'replace'` -- replaces the entire state with the mapped data, deleting keys
 *   that are no longer present (respecting `pickKeys` / `omitKeys` filters).
 */
export type VueApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for a Vue **reactive** snapshot applier.
 *
 * When `target` is `'reactive'` (or omitted), the applier mutates the reactive
 * proxy in-place (property assignment / `delete`), which is how Vue 3 tracks
 * changes on `reactive()` objects.
 *
 * This union type provides correct return-type narrowing for `toState` depending
 * on whether `mode` is `'patch'` (returns `Partial<State>`) or `'replace'`
 * (returns full `State`).
 *
 * @typeParam State - The shape of the Vue reactive object. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot maps 1:1 to the reactive shape.
 */
export type VueReactiveSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Target kind. Omit or set to `'reactive'` for Vue `reactive()` objects.
       * @defaultValue `'reactive'`
       */
      target?: 'reactive';
      /**
       * Apply mode.
       *
       * - `'patch'` -- assigns mapped properties onto the existing reactive proxy.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';
      /**
       * Maps raw snapshot data to a partial state patch.
       *
       * Receives the snapshot payload and a context object containing the reactive proxy.
       * Return a partial object whose keys will be assigned in-place.
       *
       * @defaultValue Identity cast (`data as Partial<State>`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the reactive state proxy.
       * @returns A partial state object to merge.
       */
      toState?: (data: Data, ctx: { state: State }) => Partial<State>;
      /**
       * Allow only these top-level keys to be updated by snapshots.
       *
       * Mutually exclusive with `omitKeys`.
       * Use this to keep ephemeral/local-only fields (like UI flags) isolated.
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
      /** Target kind. Omit or set to `'reactive'` for Vue `reactive()` objects. */
      target?: 'reactive';
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
       * @param ctx  - Context providing access to the reactive state proxy.
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
 * Configuration options for a Vue **ref** snapshot applier.
 *
 * When `target` is `'ref'`, the applier replaces `ref.value` with a new object
 * on every apply. This works with both `ref()` and `shallowRef()`. Vue's
 * reactivity system will pick up the `.value` change and notify all dependents.
 *
 * @typeParam State - The shape of the ref's inner value. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot maps 1:1 to the ref shape.
 */
export type VueRefSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Must be `'ref'` to opt into the Vue ref target path.
       */
      target: 'ref';
      /**
       * Apply mode.
       *
       * - `'patch'` -- spreads the mapped data onto the current `ref.value`,
       *   producing a new object reference: `{ ...ref.value, ...patch }`.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';
      /**
       * Maps raw snapshot data to a partial state patch.
       *
       * Receives the snapshot payload and a context object containing the target ref.
       *
       * @defaultValue Identity cast (`data as Partial<State>`).
       *
       * @param data - The raw snapshot payload.
       * @param ctx  - Context providing access to the target Vue ref.
       * @returns A partial state object to merge.
       */
      toState?: (data: Data, ctx: { ref: VueRefLike<State> }) => Partial<State>;
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
       * Must be `'ref'` to opt into the Vue ref target path.
       */
      target: 'ref';
      /**
       * Apply mode.
       *
       * - `'replace'` -- replaces `ref.value` entirely with the mapped data,
       *   preserving only keys excluded by `pickKeys` / `omitKeys` from the current value.
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
       * @param ctx  - Context providing access to the target Vue ref.
       * @returns The full next state.
       */
      toState?: (data: Data, ctx: { ref: VueRefLike<State> }) => State;
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
 * Union of all Vue snapshot applier option shapes.
 *
 * Discriminated by the `target` field:
 * - `'reactive'` (or omitted) -- {@link VueReactiveSnapshotApplierOptions}
 * - `'ref'` -- {@link VueRefSnapshotApplierOptions}
 *
 * @typeParam State - The shape of the Vue reactive object or ref value. Must be a plain object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 */
export type VueSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | VueReactiveSnapshotApplierOptions<State, Data>
  | VueRefSnapshotApplierOptions<State, Data>;

// ---------------------------------------------------------------------------
// Local helpers (shared with other adapters)
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
// Factory function
// ---------------------------------------------------------------------------

/**
 * Creates a {@link SnapshotApplier} that applies snapshots into a **Vue `reactive()` object**.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events -- those responsibilities belong to the
 * {@link @statesync/core!createRevisionSync | revision sync engine}.
 *
 * **Reactivity:** The applier mutates the reactive proxy in-place (property
 * assignment / `delete`). Vue's dependency tracking picks up these mutations
 * automatically, so any `computed`, `watch`, or template binding that reads
 * affected properties will re-evaluate.
 *
 * @typeParam State - The shape of the reactive object. Must be a plain object.
 * @typeParam Data  - The snapshot payload type. Defaults to `State`.
 *
 * @param state   - A Vue `reactive()` proxy object.
 * @param options - Optional configuration for apply mode, key filtering, and data mapping.
 * @returns A {@link SnapshotApplier} whose `apply()` method mutates the reactive proxy.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example
 * ```ts
 * import { reactive } from 'vue';
 * import { createVueSnapshotApplier } from '@statesync/vue';
 * import { createRevisionSync } from '@statesync/core';
 *
 * interface AppState { count: number; name: string }
 *
 * const state = reactive<AppState>({ count: 0, name: '' });
 * const applier = createVueSnapshotApplier(state);
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
export function createVueSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  state: State,
  options?: VueReactiveSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Creates a {@link SnapshotApplier} that applies snapshots into a **Vue `ref()`** (or `shallowRef()`).
 *
 * **Reactivity:** The applier replaces `ref.value` with a new object on every
 * apply call. Vue triggers watchers and re-renders because the `.value`
 * assignment is a tracked setter. This approach works well with `shallowRef()`
 * when deep reactivity is not needed (better performance for large state trees).
 *
 * @typeParam State - The shape of the ref's inner value. Must be a plain object.
 * @typeParam Data  - The snapshot payload type. Defaults to `State`.
 *
 * @param ref     - A Vue `ref()` or `shallowRef()` (or any object satisfying {@link VueRefLike}).
 * @param options - Configuration with `target: 'ref'` plus optional mode, key filtering,
 *                  and data mapping.
 * @returns A {@link SnapshotApplier} whose `apply()` method replaces `ref.value`.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { shallowRef, onMounted, onUnmounted } from 'vue';
 * import { createVueSnapshotApplier } from '@statesync/vue';
 * import { createRevisionSync } from '@statesync/core';
 *
 * interface AppState { count: number; name: string }
 *
 * const state = shallowRef<AppState>({ count: 0, name: '' });
 * const applier = createVueSnapshotApplier(state, { target: 'ref' });
 *
 * const sync = createRevisionSync({
 *   topic: 'app-state',
 *   subscriber,
 *   provider,
 *   applier,
 * });
 *
 * onMounted(() => sync.start());
 * onUnmounted(() => sync.stop());
 * </script>
 *
 * <template>
 *   <p>Count: {{ state.count }}</p>
 * </template>
 * ```
 */
export function createVueSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  ref: VueRefLike<State>,
  options: VueRefSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/** @internal Implementation overload. */
export function createVueSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  stateOrRef: State | VueRefLike<State>,
  options: VueSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const targetKind: VueTargetKind =
    'target' in options && options.target === 'ref' ? 'ref' : 'reactive';
  const mode: VueApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  // Branch early so that `toState` is extracted from the concrete options type.
  // This avoids the `as never` casts that were previously needed at call sites.

  if (targetKind === 'ref') {
    const ref = stateOrRef as VueRefLike<State>;
    const refOptions = options as VueRefSnapshotApplierOptions<State, Data>;
    const toState =
      refOptions.toState ?? ((data: Data) => data as unknown as Partial<State> | State);

    return {
      apply(snapshot: SnapshotEnvelope<Data>): void {
        const mapped = toState(snapshot.data, { ref });

        if (!isPlainObject(mapped)) {
          const message =
            '@statesync/vue: toState(data) must return a plain object (top-level state)';
          if (strict) throw new Error(message);
          return;
        }

        if (mode === 'replace') {
          const next = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
          // Preserve omitted keys from current value.
          const preserved: Record<string, unknown> = {};
          for (const key of Object.keys(ref.value as Record<string, unknown>)) {
            if (!allowKey(key as keyof State)) {
              preserved[key] = (ref.value as Record<string, unknown>)[key];
            }
          }
          ref.value = { ...preserved, ...next } as State;
          return;
        }

        // patch mode
        const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
        ref.value = { ...ref.value, ...patch };
      },
    };
  }

  // reactive target
  const state = stateOrRef as State;
  const reactiveOptions = options as VueReactiveSnapshotApplierOptions<State, Data>;
  const toState =
    reactiveOptions.toState ?? ((data: Data) => data as unknown as Partial<State> | State);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { state });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/vue: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
        const dyn = state as Record<string, unknown>;
        // Delete keys not present in next state (top-level only).
        for (const key of Object.keys(state)) {
          if (!allowKey(key as keyof State)) continue;
          if (!(key in next)) {
            delete dyn[key];
          }
        }
        // Assign keys present in next state.
        for (const [key, value] of Object.entries(next)) {
          dyn[key] = value;
        }
        return;
      }

      // patch mode
      const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
      const dyn = state as Record<string, unknown>;
      for (const [key, value] of Object.entries(patch)) {
        dyn[key] = value;
      }
    },
  };
}
