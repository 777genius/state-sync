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

export type SvelteTargetKind = 'store' | 'state';

export type SvelteApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type SvelteStoreSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      target?: 'store';
      mode?: 'patch';
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => Partial<State>;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    }
  | {
      target?: 'store';
      mode: 'replace';
      toState?: (data: Data, ctx: { store: SvelteStoreLike<State> }) => State;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    };

export type SvelteStateSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      target: 'state';
      mode?: 'patch';
      toState?: (data: Data, ctx: { state: State }) => Partial<State>;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    }
  | {
      target: 'state';
      mode: 'replace';
      toState?: (data: Data, ctx: { state: State }) => State;
      pickKeys?: ReadonlyArray<keyof State>;
      omitKeys?: ReadonlyArray<keyof State>;
      strict?: boolean;
    };

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
 * Creates a SnapshotApplier that applies snapshots into a Svelte writable store.
 */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  store: SvelteStoreLike<State>,
  options?: SvelteStoreSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Creates a SnapshotApplier that applies snapshots into a Svelte 5 `$state` proxy.
 *
 * Mutates the state object in-place (property assignment / delete),
 * which is how Svelte 5 fine-grained reactivity tracks changes.
 */
export function createSvelteSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  state: State,
  options: SvelteStateSnapshotApplierOptions<State, Data>,
): SnapshotApplier<Data>;

/**
 * Implementation.
 */
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
