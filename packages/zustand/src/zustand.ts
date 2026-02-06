import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface a Zustand store satisfies.
 *
 * We intentionally avoid importing `zustand` types here so this adapter stays
 * dependency-free (from Zustand) and can be used in environments where the adapter
 * code is not imported.
 *
 * The real Zustand store implements:
 * - `getState()`
 * - `setState(partial, replace?)`
 */
export interface ZustandStoreLike<State extends Record<string, unknown>> {
  getState(): State;
  setState(
    partial: State | Partial<State> | ((state: State) => State | Partial<State>),
    replace?: boolean,
  ): void;
}

export type ZustandApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type ZustandSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Default: 'patch'
       *
       * - 'patch': calls `store.setState(partial)` (non-destructive merge)
       * - 'replace': calls `store.setState(nextState, true)` (atomic swap)
       */
      mode?: 'patch';
      /**
       * Maps snapshot data to a state patch.
       *
       * Default: identity cast (treats `data` as `Partial<State>`).
       */
      toState?: (data: Data, ctx: { store: ZustandStoreLike<State> }) => Partial<State>;
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
      toState?: (data: Data, ctx: { store: ZustandStoreLike<State> }) => State;
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
 * Creates a SnapshotApplier that applies snapshots into a Zustand store.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events.
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
