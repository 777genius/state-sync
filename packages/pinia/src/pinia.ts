import type { SnapshotApplier, SnapshotEnvelope } from 'state-sync';

/**
 * Minimal structural interface a Pinia store satisfies.
 *
 * We intentionally avoid importing `pinia` types here so this adapter stays
 * dependency-free (from Pinia) and can be used in environments where the adapter
 * code is not imported.
 *
 * The real Pinia store implements:
 * - `$state`
 * - `$patch(partial | mutator)`
 */
export interface PiniaStoreLike<State extends Record<string, unknown>> {
  /**
   * Optional store id (Pinia exposes `$id`). Useful only for debugging.
   */
  $id?: string;
  $state: State;
  $patch(patch: Partial<State> | ((state: State) => void)): void;
}

export type PiniaApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type PiniaSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Default: 'patch'
       *
       * - 'patch': calls `store.$patch(partial)` (non-destructive)
       * - 'replace': applies a top-level replace using `$patch((state) => ...)`:
       *   - deletes keys not present in `nextState`
       *   - assigns keys present in `nextState`
       *
       * Why not `store.$state = nextState`?
       * Pinia documents that assigning `$state` internally calls `$patch()`, so it
       * does not reliably remove stale keys on its own.
       */
      mode?: 'patch';
      /**
       * Maps snapshot data to a state patch.
       *
       * Default: identity cast (treats `data` as `Partial<State>`).
       */
      toState?: (data: Data, ctx: { store: PiniaStoreLike<State> }) => Partial<State>;
      /**
       * Limit which top-level keys are allowed to be updated by snapshots.
       *
       * Use this to keep ephemeral/local-only fields (like UI flags) isolated.
       */
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      /**
       * If true, throws when `toState` returns a non-object value.
       * Default: true
       */
      strict?: boolean;
    }
  | {
      mode: 'replace';
      /**
       * Maps snapshot data to a full next state.
       *
       * When using 'replace', prefer returning the full state to avoid leaving stale keys.
       */
      toState?: (data: Data, ctx: { store: PiniaStoreLike<State> }) => State;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
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
 * Creates a SnapshotApplier that applies snapshots into a Pinia store.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events.
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
          'state-sync-pinia: toState(data) must return a plain object (top-level state)';
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
