import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import {
  createReduxSnapshotApplier,
  type ReduxStoreLike,
  SNAPSHOT_ACTION_TYPE,
  type SnapshotAppliedAction,
  snapshotApplied,
  withSnapshotHandling,
} from '../src/redux';

type State = { a: number; b?: number };

type Action = { type: 'INCREMENT' } | { type: 'SET_A'; payload: number };

function baseReducer(state: State | undefined, action: Action): State {
  const current = state ?? { a: 0 };
  switch (action.type) {
    case 'INCREMENT':
      return { ...current, a: current.a + 1 };
    case 'SET_A':
      return { ...current, a: action.payload };
    default:
      return current;
  }
}

function makeStore(initial: State): ReduxStoreLike<State> {
  const wrappedReducer = withSnapshotHandling<State, Action>(baseReducer);
  let state: State = { ...initial };

  const store: ReduxStoreLike<State> = {
    getState() {
      return state;
    },
    dispatch(action: SnapshotAppliedAction<State>) {
      state = wrappedReducer(state, action);
      return action;
    },
  };
  return store;
}

function makeRawStore(initial: State): ReduxStoreLike<State> {
  let state: State = { ...initial };

  const store: ReduxStoreLike<State> = {
    getState() {
      return state;
    },
    dispatch(action: SnapshotAppliedAction<State>) {
      if (action.type === SNAPSHOT_ACTION_TYPE) {
        if (action.meta.mode === 'replace') {
          state = action.payload as State;
        } else {
          state = { ...state, ...action.payload };
        }
      }
      return action;
    },
  };
  return store;
}

function makeTypedStore<S extends Record<string, unknown>>(initial: S): ReduxStoreLike<S> {
  let state: S = { ...initial };

  const store: ReduxStoreLike<S> = {
    getState() {
      return state;
    },
    dispatch(action: SnapshotAppliedAction<S>) {
      if (action.type === SNAPSHOT_ACTION_TYPE) {
        if (action.meta.mode === 'replace') {
          state = action.payload as S;
        } else {
          state = { ...state, ...action.payload };
        }
      }
      return action;
    },
  };
  return store;
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

// ---------------------------------------------------------------------------
// createReduxSnapshotApplier
// ---------------------------------------------------------------------------

describe('@statesync/redux: createReduxSnapshotApplier', () => {
  it('patch mode (default): merges into state via dispatch', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: assigns state atomically', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store.getState()).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.getState()).toEqual({ a: 123 });
    expect('b' in store.getState()).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State>(store, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, { a: number; meta: string }>(store, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store.getState()).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, string>(store, {
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
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store, {
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
    const applier = createReduxSnapshotApplier<State>(store, {
      mode: 'replace',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(store.getState()).toEqual({ a: 100, b: 2 });
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(store.getState()).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(store.getState()).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: state unchanged', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, string>(store, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, string>(store, {
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
    const applier = createReduxSnapshotApplier<State, { val: number }>(store, {
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
    const applier = createReduxSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store.getState()).toEqual({});
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const initial: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const store = makeTypedStore(initial);
    const applier = createReduxSnapshotApplier<DeepState, Partial<DeepState>>(store);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(store.getState().config).toEqual({ theme: 'light', lang: 'fr' });
    expect(store.getState().count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// withSnapshotHandling
// ---------------------------------------------------------------------------

describe('@statesync/redux: withSnapshotHandling', () => {
  it('passes through regular actions to the original reducer', () => {
    const wrapped = withSnapshotHandling<State, Action>(baseReducer);

    const state = wrapped({ a: 1, b: 2 }, { type: 'INCREMENT' });

    expect(state).toEqual({ a: 2, b: 2 });
  });

  it('handles patch mode snapshot action', () => {
    const wrapped = withSnapshotHandling<State, Action>(baseReducer);

    const action = snapshotApplied<State>({ a: 42 }, { mode: 'patch', revision: '1' });
    const state = wrapped({ a: 1, b: 2 }, action);

    expect(state).toEqual({ a: 42, b: 2 });
  });

  it('handles replace mode snapshot action', () => {
    const wrapped = withSnapshotHandling<State, Action>(baseReducer);

    const action = snapshotApplied<State>({ a: 99 } as State, { mode: 'replace', revision: '1' });
    const state = wrapped({ a: 1, b: 2 }, action);

    expect(state).toEqual({ a: 99 });
  });

  it('initializes state via original reducer when state is undefined', () => {
    const wrapped = withSnapshotHandling<State, Action>(baseReducer);

    const action = snapshotApplied<State>({ a: 5 }, { mode: 'patch', revision: '1' });
    const state = wrapped(undefined, action);

    expect(state).toEqual({ a: 5 });
  });
});

// ---------------------------------------------------------------------------
// snapshotApplied + SNAPSHOT_ACTION_TYPE
// ---------------------------------------------------------------------------

describe('@statesync/redux: snapshotApplied + SNAPSHOT_ACTION_TYPE', () => {
  it('creates action with correct shape', () => {
    const action = snapshotApplied<State>({ a: 10 }, { mode: 'patch', revision: 'rev-1' });

    expect(action).toEqual({
      type: '@@statesync/SNAPSHOT_APPLIED',
      payload: { a: 10 },
      meta: { mode: 'patch', revision: 'rev-1' },
    });
  });

  it('exposes type constant on the action creator', () => {
    expect(snapshotApplied.type).toBe(SNAPSHOT_ACTION_TYPE);
    expect(snapshotApplied.type).toBe('@@statesync/SNAPSHOT_APPLIED');
  });
});

// ---------------------------------------------------------------------------
// Integration: full round-trip
// ---------------------------------------------------------------------------

describe('@statesync/redux: integration', () => {
  it('full round-trip: applier → dispatch → HOF reducer → state', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, { value: number }>(store, {
      toState: (data) => ({ a: data.value }),
      omitKeys: ['b'],
    });

    applier.apply(snapshot({ value: 42 }, 'rev-5'));

    expect(store.getState()).toEqual({ a: 42, b: 2 });
  });

  it('works with a raw store (no withSnapshotHandling)', () => {
    const store = makeRawStore({ a: 1, b: 2 });
    const applier = createReduxSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 99 }, '1'));

    expect(store.getState()).toEqual({ a: 99, b: 2 });
  });
});
