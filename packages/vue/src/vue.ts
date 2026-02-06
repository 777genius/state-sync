import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface for a Vue ref-like container.
 *
 * Compatible with `Ref<T>`, `ShallowRef<T>`, or any object with a `.value`
 * property of type `State`.
 */
export interface VueRefLike<State> {
  value: State;
}

export type VueTargetKind = 'ref' | 'reactive';

export type VueApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type VueReactiveSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      target?: 'reactive';
      mode?: 'patch';
      toState?: (data: Data, ctx: { state: State }) => Partial<State>;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    }
  | {
      target?: 'reactive';
      mode: 'replace';
      toState?: (data: Data, ctx: { state: State }) => State;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    };

export type VueRefSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      target: 'ref';
      mode?: 'patch';
      toState?: (data: Data, ctx: { ref: VueRefLike<State> }) => Partial<State>;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    }
  | {
      target: 'ref';
      mode: 'replace';
      toState?: (data: Data, ctx: { ref: VueRefLike<State> }) => State;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    };

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
 * Creates a SnapshotApplier that applies snapshots into a Vue reactive object.
 */
export function createVueSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  state: State,
  options?: VueReactiveSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Creates a SnapshotApplier that applies snapshots into a Vue ref.
 */
export function createVueSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  ref: VueRefLike<State>,
  options: VueRefSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Implementation.
 */
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
