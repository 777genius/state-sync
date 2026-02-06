import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

/**
 * Valtio uses mutable proxies. The "store" is just the proxy object itself.
 *
 * We intentionally avoid importing `valtio` types here so this adapter stays
 * dependency-free and can be used in environments where valtio is not installed.
 */
export type ValtioProxyLike<State extends Record<string, unknown>> = State;

export type ValtioApplyMode = 'patch' | 'replace';

type PickOrOmitKeys<State extends Record<string, unknown>> =
  | { pickKeys?: ReadonlyArray<keyof State>; omitKeys?: never }
  | { pickKeys?: never; omitKeys?: ReadonlyArray<keyof State> }
  | { pickKeys?: never; omitKeys?: never };

export type ValtioSnapshotApplierOptions<State extends Record<string, unknown>, Data> =
  | {
      /**
       * Default: 'patch'
       *
       * - 'patch': iterates filtered keys and assigns `proxy[key] = value`
       * - 'replace': first deletes allowed keys not in new state, then assigns
       *   keys present in new state. The proxy reference stays the same.
       */
      mode?: 'patch';
      /**
       * Maps snapshot data to a state patch.
       *
       * Default: identity cast (treats `data` as `Partial<State>`).
       */
      toState?: (data: Data, ctx: { proxy: ValtioProxyLike<State> }) => Partial<State>;
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
      toState?: (data: Data, ctx: { proxy: ValtioProxyLike<State> }) => State;
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
 * Creates a SnapshotApplier that applies snapshots into a Valtio proxy.
 *
 * This is a framework adapter: it only focuses on *how to apply a snapshot*
 * into a concrete state container. It does not fetch snapshots and does not
 * listen to invalidation events.
 *
 * The proxy reference is never replaced — mutations are applied directly
 * so that existing Valtio subscribers continue to work.
 */
export function createValtioSnapshotApplier<State extends Record<string, unknown>, Data = State>(
  proxy: ValtioProxyLike<State>,
  options: ValtioSnapshotApplierOptions<State, Data> = {},
): SnapshotApplier<Data> {
  const mode: ValtioApplyMode = options.mode ?? 'patch';
  const strict = options.strict ?? true;

  const toState = options.toState ?? ((data: Data) => data as unknown as Partial<State> | State);
  const allowKey = makeKeyFilter<State>(options as PickOrOmitKeys<State>);

  return {
    apply(snapshot: SnapshotEnvelope<Data>): void {
      const mapped = toState(snapshot.data, { proxy });

      if (!isPlainObject(mapped)) {
        const message =
          '@statesync/valtio: toState(data) must return a plain object (top-level state)';
        if (strict) throw new Error(message);
        return;
      }

      if (mode === 'replace') {
        const next = filterTopLevelKeys<State>(mapped, allowKey);

        // Delete keys not present in next state (top-level only).
        for (const key of Object.keys(proxy)) {
          const k = key as keyof State;
          if (!allowKey(k)) continue;
          if (!(key in next)) {
            delete (proxy as Record<string, unknown>)[key];
          }
        }

        // Assign keys present in next state.
        for (const [key, value] of Object.entries(next)) {
          (proxy as Record<string, unknown>)[key] = value;
        }
        return;
      }

      // patch mode: assign filtered keys directly on the proxy.
      const patch = filterTopLevelKeys<State>(mapped, allowKey);
      for (const [key, value] of Object.entries(patch)) {
        (proxy as Record<string, unknown>)[key] = value;
      }
    },
  };
}
