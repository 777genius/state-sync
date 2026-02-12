import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import { createJotaiSnapshotApplier, type JotaiStoreLike } from '../src/jotai';

type State = { a: number; b?: number };

/**
 * Simulates a Jotai store + atom pair without importing jotai.
 * Supports both direct value and updater function forms of `set`.
 */
function makeAtomStore<S>(initial: S): { store: JotaiStoreLike<S, symbol>; atom: symbol } {
  const atomKey = Symbol('test-atom');
  let value: S = { ...initial } as S;

  const store: JotaiStoreLike<S, symbol> = {
    get(a: symbol): S {
      if (a !== atomKey) throw new Error('Unknown atom');
      return value;
    },
    set(a: symbol, v: S | ((prev: S) => S)): void {
      if (a !== atomKey) throw new Error('Unknown atom');
      if (typeof v === 'function') {
        value = (v as (prev: S) => S)(value);
      } else {
        value = v;
      }
    },
  };

  return { store, atom: atomKey };
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/jotai: createJotaiSnapshotApplier', () => {
  it('patch mode (default): merges into atom state', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.get(atom)).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: replaces atom state atomically', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, State, symbol>(store, atom, {
      mode: 'replace',
    });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store.get(atom)).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, State, symbol>(store, atom, {
      mode: 'replace',
    });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.get(atom)).toEqual({ a: 123 });
    expect('b' in store.get(atom)).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store.get(atom)).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, State, symbol>(store, atom, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store.get(atom)).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, { a: number; meta: string }, symbol>(
      store,
      atom,
      {
        toState: (data) => ({ a: data.a }),
      },
    );

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store.get(atom)).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, string, symbol>(store, atom, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store.get(atom)).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, string, symbol>(store, atom, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
    });
    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(store.get(atom)).toEqual({ a: 1, b: 2 });
  });

  it('toState receives ctx.store and ctx.atom', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    let receivedStore: unknown;
    let receivedAtom: unknown;
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom, {
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        receivedAtom = ctx.atom;
        return data;
      },
    });
    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));
    expect(receivedStore).toBe(store);
    expect(receivedAtom).toBe(atom);
  });

  it('replace mode + pickKeys: only replaces picked keys, preserves others', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, State, symbol>(store, atom, {
      mode: 'replace',
      pickKeys: ['a'],
    });
    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(store.get(atom)).toEqual({ a: 100, b: 2 });
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(store.get(atom)).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(store.get(atom)).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: atom unchanged', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atom);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(store.get(atom)).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, string, symbol>(store, atom, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, string, symbol>(store, atom, {
      // @ts-expect-error - testing runtime validation
      toState: () => null,
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('toState in replace mode receives ctx.store and ctx.atom', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    let receivedStore: unknown;
    let receivedAtom: unknown;
    const applier = createJotaiSnapshotApplier<State, { val: number }, symbol>(store, atom, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        receivedAtom = ctx.atom;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedStore).toBe(store);
    expect(receivedAtom).toBe(atom);
    expect(store.get(atom)).toEqual({ a: 42 });
  });

  it('replace mode with empty data: removes all allowed keys', () => {
    const { store, atom } = makeAtomStore<State>({ a: 1, b: 2 });
    const applier = createJotaiSnapshotApplier<State, State, symbol>(store, atom, {
      mode: 'replace',
    });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store.get(atom)).toEqual({});
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const { store, atom } = makeAtomStore<DeepState>({
      config: { theme: 'dark', lang: 'en' },
      count: 0,
    });
    const applier = createJotaiSnapshotApplier<DeepState, Partial<DeepState>, symbol>(store, atom);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(store.get(atom).config).toEqual({ theme: 'light', lang: 'fr' });
    expect(store.get(atom).count).toBe(0);
  });

  it('uses updater function for atomic patch (no separate get+set)', () => {
    const setCalls: Array<{ type: 'direct' | 'updater' }> = [];
    const atomKey = Symbol('test-atom');
    let value: State = { a: 1, b: 2 };

    const store: JotaiStoreLike<State, symbol> = {
      get(a: symbol) {
        if (a !== atomKey) throw new Error('Unknown atom');
        return value;
      },
      set(a: symbol, v: State | ((prev: State) => State)) {
        if (a !== atomKey) throw new Error('Unknown atom');
        if (typeof v === 'function') {
          setCalls.push({ type: 'updater' });
          value = (v as (prev: State) => State)(value);
        } else {
          setCalls.push({ type: 'direct' });
          value = v;
        }
      },
    };

    const applier = createJotaiSnapshotApplier<State, Partial<State>, symbol>(store, atomKey);
    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    // Should use updater form, not direct value
    expect(setCalls).toEqual([{ type: 'updater' }]);
    expect(value).toEqual({ a: 10, b: 2 });
  });
});
