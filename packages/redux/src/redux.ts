import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Action type constant dispatched by the adapter when applying a snapshot.
 *
 * Reducers wrapped with {@link withSnapshotHandling} intercept this action
 * automatically. You can also handle it manually in RTK `extraReducers` or
 * a plain `switch` reducer.
 */
export const SNAPSHOT_ACTION_TYPE = '@@statesync/SNAPSHOT_APPLIED' as const;

/**
 * The strategy used to apply incoming snapshot data to the Redux store.
 *
 * - `'patch'` — Non-destructive shallow merge. Existing keys not present
 *   in the snapshot are left untouched.
 * - `'replace'` — Atomic state swap. The entire state is replaced; keys
 *   excluded by `omitKeys` are preserved by being merged back.
 */
export type ReduxApplyMode = 'patch' | 'replace';

/**
 * Shape of the action dispatched by {@link createReduxSnapshotApplier}.
 *
 * @typeParam State - The shape of the Redux store's state.
 */
export interface SnapshotAppliedAction<State> {
  type: typeof SNAPSHOT_ACTION_TYPE;
  payload: Partial<State> | State;
  meta: {
    mode: ReduxApplyMode;
    revision: string;
  };
}

/**
 * Minimal structural interface that a Redux store satisfies.
 *
 * We intentionally avoid importing `redux` types here so this adapter stays
 * dependency-free and can be used in environments where the `redux` or
 * `@reduxjs/toolkit` package is not installed. Any object that structurally
 * matches this interface — including a real Redux `Store` — can be passed to
 * {@link createReduxSnapshotApplier}.
 *
 * @typeParam State - The shape of the Redux store's state.
 */
export interface ReduxStoreLike<State extends Record<string, unknown>> {
  /**
   * Returns the current state tree of the store.
   *
   * Used by the adapter in `'replace'` mode to read existing state so that
   * keys excluded by `omitKeys` can be preserved.
   *
   * @returns The current state object.
   */
  getState(): State;

  /**
   * Dispatches an action. This is the only way to trigger a state change in
   * Redux.
   *
   * The adapter dispatches a {@link SnapshotAppliedAction} containing the
   * mapped and filtered snapshot data.
   *
   * @param action - The action to dispatch.
   * @returns The dispatched action.
   */
  dispatch(action: SnapshotAppliedAction<State>): unknown;
}

/**
 * Internal discriminated union constraining `pickKeys` / `omitKeys` to be
 * mutually exclusive. At most one of the two may be provided.
 *
 * @typeParam State - The shape of the Redux store's state.
 * @internal
 */
type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

/**
 * Configuration options for {@link createReduxSnapshotApplier}.
 *
 * This is a discriminated union on the {@link ReduxApplyMode | mode} field:
 *
 * - When `mode` is `'patch'` (or omitted), `toState` is expected to return
 *   `Partial<State>`.
 * - When `mode` is `'replace'`, `toState` is expected to return the full
 *   `State`.
 *
 * @typeParam State - The shape of the Redux store's state.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *                    Defaults to `State` when the snapshot data matches the
 *                    store shape directly.
 */
export type ReduxSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * The apply strategy. Defaults to `'patch'`.
       *
       * - `'patch'`: dispatches an action with partial state — the HOF reducer
       *   performs a non-destructive shallow merge.
       * - `'replace'`: dispatches an action with full state — the HOF reducer
       *   replaces the entire state, preserving omitted keys.
       *
       * @defaultValue `'patch'`
       */
      mode?: 'patch';

      /**
       * Maps raw snapshot data to a state patch object.
       *
       * @param data - The raw snapshot payload from the sync engine.
       * @param ctx  - Context object providing access to the target store.
       * @returns A partial state object to be shallow-merged into the store.
       *
       * @defaultValue Identity cast — treats `data` as `Partial<State>`.
       */
      toState?: (data: Data, ctx: { store: ReduxStoreLike<State> }) => Partial<State>;

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
       * @param ctx  - Context object providing access to the target store.
       * @returns The full next state to replace the current store state with.
       *
       * @defaultValue Identity cast — treats `data` as `State`.
       */
      toState?: (data: Data, ctx: { store: ReduxStoreLike<State> }) => State;

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
// Internal helpers (same as other adapters)
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
// Action creator
// ---------------------------------------------------------------------------

/**
 * Creates a {@link SnapshotAppliedAction} — the action dispatched by the
 * adapter when a snapshot is applied.
 *
 * You can use this action creator together with RTK `extraReducers` to handle
 * snapshot application in specific slices without wrapping the root reducer
 * with {@link withSnapshotHandling}.
 *
 * @typeParam State - The shape of the state that the snapshot applies to.
 *
 * @param payload - The (already mapped and filtered) state data.
 * @param meta    - Action metadata containing the apply mode and revision.
 * @returns The action object to dispatch.
 *
 * @example Manual handling in an RTK slice
 * ```ts
 * import { createSlice } from '@reduxjs/toolkit';
 * import { snapshotApplied } from '@statesync/redux';
 *
 * const cartSlice = createSlice({
 *   name: 'cart',
 *   initialState: { items: [], total: 0 },
 *   reducers: { ... },
 *   extraReducers: (builder) => {
 *     builder.addCase(snapshotApplied.type, (state, action) => {
 *       return { ...state, ...action.payload };
 *     });
 *   },
 * });
 * ```
 */
export function snapshotApplied<State>(
  payload: Partial<State> | State,
  meta: { mode: ReduxApplyMode; revision: string },
): SnapshotAppliedAction<State> {
  return {
    type: SNAPSHOT_ACTION_TYPE,
    payload,
    meta,
  };
}

/**
 * Expose `SNAPSHOT_ACTION_TYPE` as `.type` on the action creator for
 * compatibility with RTK `builder.addCase(snapshotApplied.type, ...)`.
 */
snapshotApplied.type = SNAPSHOT_ACTION_TYPE;

// ---------------------------------------------------------------------------
// HOF reducer wrapper
// ---------------------------------------------------------------------------

/**
 * Higher-order function that wraps an existing reducer to automatically handle
 * {@link SNAPSHOT_ACTION_TYPE} actions.
 *
 * When the wrapped reducer receives a snapshot action:
 * - In `'patch'` mode: returns `{ ...state, ...payload }` (shallow merge).
 * - In `'replace'` mode: returns `payload as State` (full replacement).
 *
 * All other actions are forwarded to the original reducer unchanged.
 *
 * @typeParam State  - The shape of the reducer's state.
 * @typeParam Action - The union of actions the original reducer handles.
 *
 * @param reducer - The original reducer to wrap.
 * @returns A new reducer that intercepts snapshot actions.
 *
 * @example
 * ```ts
 * import { configureStore } from '@reduxjs/toolkit';
 * import { withSnapshotHandling } from '@statesync/redux';
 *
 * const store = configureStore({
 *   reducer: withSnapshotHandling(rootReducer),
 * });
 * ```
 */
export function withSnapshotHandling<State extends Record<string, unknown>, Action>(
  reducer: (state: State | undefined, action: Action) => State,
): (state: State | undefined, action: Action | SnapshotAppliedAction<State>) => State {
  return (state: State | undefined, action: Action | SnapshotAppliedAction<State>): State => {
    if (
      isPlainObject(action) &&
      (action as Record<string, unknown>).type === SNAPSHOT_ACTION_TYPE
    ) {
      const snapshotAction = action as unknown as SnapshotAppliedAction<State>;
      const currentState =
        state ?? reducer(undefined, { type: '@@statesync/INIT' } as unknown as Action);

      if (snapshotAction.meta.mode === 'replace') {
        return snapshotAction.payload as State;
      }

      return { ...currentState, ...snapshotAction.payload };
    }

    return reducer(state, action as Action);
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a {@link SnapshotApplier} that applies incoming snapshots into a
 * Redux store by dispatching a {@link SnapshotAppliedAction}.
 *
 * This is a framework adapter: it only focuses on **how to apply a snapshot**
 * into a concrete Redux state container. It does not fetch snapshots and does
 * not subscribe to invalidation events — those concerns belong to the sync
 * engine (`@statesync/core`).
 *
 * **How state updates propagate:**
 *
 * 1. The sync engine receives an invalidation event and fetches a new
 *    snapshot from the server.
 * 2. The engine calls `applier.apply(envelope)` with the snapshot data.
 * 3. This adapter maps the snapshot data to a state patch (via `toState`),
 *    filters keys (via `pickKeys` / `omitKeys`), and dispatches a
 *    {@link SnapshotAppliedAction} to the Redux store.
 * 4. A reducer (either wrapped with {@link withSnapshotHandling} or handling
 *    `SNAPSHOT_ACTION_TYPE` manually) processes the action and produces the
 *    next state.
 *
 * **Key difference from other adapters:** Redux state can only be updated via
 * dispatching actions through reducers. This adapter dispatches a
 * well-defined action instead of mutating state directly.
 *
 * @typeParam State - The shape of the Redux store's state object.
 * @typeParam Data  - The snapshot payload type received from the sync engine.
 *   Defaults to `State` when the snapshot data matches the store shape.
 *
 * @param store   - The Redux store (or any object satisfying
 *   {@link ReduxStoreLike}) to apply snapshots into.
 * @param options - Configuration for apply mode, key filtering, data mapping,
 *   and strict validation. See {@link ReduxSnapshotApplierOptions}.
 * @returns A {@link SnapshotApplier} whose `apply` method dispatches snapshot
 *   data into the Redux store.
 *
 * @throws {Error} When `strict` is `true` (the default) and `toState` returns
 *   a non-plain-object value.
 *
 * @example Basic usage with a Redux store (patch mode)
 * ```ts
 * import { configureStore } from '@reduxjs/toolkit';
 * import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';
 * import { createRevisionSync } from '@statesync/core';
 *
 * const store = configureStore({
 *   reducer: withSnapshotHandling(rootReducer),
 * });
 *
 * const applier = createReduxSnapshotApplier(store);
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
 * const applier = createReduxSnapshotApplier(store, {
 *   mode: 'replace',
 *   omitKeys: ['localUiFlag'],
 * });
 * ```
 *
 * @example Custom data mapping
 * ```ts
 * interface ApiResponse { user: { name: string; email: string } }
 *
 * const applier = createReduxSnapshotApplier<ProfileState, ApiResponse>(
 *   store,
 *   { toState: (data) => data.user },
 * );
 * ```
 */
export function createReduxSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: ReduxStoreLike<State>,
  options: ReduxSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: ReduxApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { store });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/redux: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);
        const current = store.getState();
        const rebuilt: Record<string, unknown> = {};

        for (const key of Object.keys(current)) {
          if (!allowKey(key as keyof State)) {
            rebuilt[key] = current[key as keyof State];
          }
        }

        for (const [key, value] of Object.entries(next)) {
          rebuilt[key] = value;
        }

        store.dispatch(
          snapshotApplied<State>(rebuilt as State, {
            mode,
            revision: snapshot.revision as string,
          }),
        );
        return;
      }

      const patch = filterTopLevelKeys<State>(mapped, allowKey) as Partial<State>;
      store.dispatch(
        snapshotApplied<State>(patch, {
          mode,
          revision: snapshot.revision as string,
        }),
      );
    },
  };
}
