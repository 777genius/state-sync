import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import { createZustandSnapshotApplier, type ZustandStoreLike } from '../src/zustand';

type State = { a: number; b?: number };

function makeStore(initial: State): ZustandStoreLike<State> {
  let state: State = { ...initial };

  const store: ZustandStoreLike<State> = {
    getState() {
      return state;
    },
    setState(partial, replace) {
      if (typeof partial === 'function') {
        const result = partial(state);
        if (replace) {
          state = result as State;
        } else {
          state = { ...state, ...result };
        }
        return;
      }
      if (replace) {
        state = partial as State;
      } else {
        state = { ...state, ...partial };
      }
    },
  };
  return store;
}

function makeTypedStore<S extends Record<string, unknown>>(initial: S): ZustandStoreLike<S> {
  let state: S = { ...initial };

  const store: ZustandStoreLike<S> = {
    getState() {
      return state;
    },
    setState(partial, replace) {
      if (typeof partial === 'function') {
        const result = partial(state);
        if (replace) {
          state = result as S;
        } else {
          state = { ...state, ...result };
        }
        return;
      }
      if (replace) {
        state = partial as S;
      } else {
        state = { ...state, ...partial };
      }
    },
  };
  return store;
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/zustand: createZustandSnapshotApplier', () => {
  it('patch mode (default): merges into state via setState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: assigns state atomically', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store.getState()).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.getState()).toEqual({ a: 123 });
    expect('b' in store.getState()).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State>(store, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, { a: number; meta: string }>(store, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store.getState()).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
    });

    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });

  it('toState receives ctx.store', () => {
    const store = makeStore({ a: 1, b: 2 });
    let receivedStore: unknown;
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store, {
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        return data;
      },
    });

    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));
    expect(receivedStore).toBe(store);
  });

  it('replace mode + pickKeys: only replaces picked keys, preserves others', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State>(store, {
      mode: 'replace',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(store.getState()).toEqual({ a: 100, b: 2 });
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(store.getState()).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: state unchanged', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, string>(store, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State, string>(store, {
      // @ts-expect-error - testing runtime validation
      toState: () => null,
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('toState in replace mode receives ctx.store', () => {
    const store = makeStore({ a: 1, b: 2 });
    let receivedStore: unknown;
    const applier = createZustandSnapshotApplier<State, { val: number }>(store, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedStore).toBe(store);
    expect(store.getState()).toEqual({ a: 42 });
  });

  it('replace mode with empty data: removes all allowed keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createZustandSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store.getState()).toEqual({});
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const initial: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const store = makeTypedStore(initial);
    const applier = createZustandSnapshotApplier<DeepState, Partial<DeepState>>(store);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    // Top-level key 'config' is fully replaced, not deep-merged
    expect(store.getState().config).toEqual({ theme: 'light', lang: 'fr' });
    expect(store.getState().count).toBe(0);
  });
});
