import type { Revision, SnapshotEnvelope } from 'state-sync';
import { describe, expect, it } from 'vitest';
import { createPiniaSnapshotApplier, type PiniaStoreLike } from '../src/pinia';

type State = { a: number; b?: number };

function makeStore(initial: State): PiniaStoreLike<State> {
  const store: PiniaStoreLike<State> = {
    $state: initial,
    $patch(patch) {
      if (typeof patch === 'function') {
        patch(this.$state);
        return;
      }
      Object.assign(this.$state, patch);
    },
  };
  return store;
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('state-sync-pinia: createPiniaSnapshotApplier', () => {
  it('patch mode (default): merges into $state via $patch', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.$state).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: assigns $state', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store.$state).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.$state).toEqual({ a: 123 });
    expect('b' in store.$state).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store.$state).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State>(store, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store.$state).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State, { a: number; meta: string }>(store, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store.$state).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createPiniaSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store.$state).toEqual({ a: 1, b: 2 });
  });
});
