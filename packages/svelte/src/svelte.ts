import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Minimal structural interface for a Svelte writable store.
 *
 * We intentionally avoid importing `svelte/store` types so this adapter stays
 * dependency-free (from Svelte) and can be used in any environment.
 *
 * The real Svelte writable store implements:
 * - `set(value)`
 * - `update(updater)`
 * - `subscribe(callback)`  (not needed for applying snapshots)
 */
export interface SvelteStoreLike<State> {
  set(value: State): void;
  update(updater: (current: State) => State): void;
}

export type SvelteApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type SvelteSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Default: 'patch'
       *
       * - 'patch': calls `store.update(current => ({ ...current, ...filteredPatch }))`
       *   Spread merge creates a new reference (Svelte reactivity requires new reference).
       * - 'replace': builds a new state keeping omitted keys from current,
       *   assigns allowed keys from snapshot. Always creates a new reference.
       */
      mode?: 'patch';
      /**
       * Maps snapshot data to a state patch.
       *
       * Default: identity cast (treats `data` as `Partial<State>`).
       */
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => Partial<State>;
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
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => State;
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
 * Creates a SnapshotApplier that applies snapshots into a Svelte writable store.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events.
 */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: SvelteStoreLike<State>,
  options: SvelteSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: SvelteApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

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
          // Preserve omitted keys from current
          for (const key of Object.keys(current as Record<string, unknown>)) {
            if (!allowKey(key as keyof State)) {
              base[key] = (current as Record<string, unknown>)[key];
            }
          }
          // Apply allowed keys from snapshot
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
