import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import { createSvelteSnapshotApplier, type SvelteStoreLike } from '../src/svelte';

type State = { a: number; b?: number };

function makeStore(initial: State): SvelteStoreLike<State> & { value: State } {
  const container = { value: { ...initial } };
  return {
    get value() {
      return container.value;
    },
    set(v: State) {
      container.value = v;
    },
    update(fn: (current: State) => State) {
      container.value = fn(container.value);
    },
  };
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/svelte: createSvelteSnapshotApplier', () => {
  it('patch mode (default): merges into store via update', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.value).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: sets full state', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store.value).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.value).toEqual({ a: 123 });
    expect('b' in store.value).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store.value).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State>(store, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store.value).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, { a: number; meta: string }>(store, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store.value).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store.value).toEqual({ a: 1, b: 2 });
  });

  it('patch mode: creates a new reference (Svelte reactivity)', () => {
    const store = makeStore({ a: 1, b: 2 });
    const originalRef = store.value;
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store.value).not.toBe(originalRef);
    expect(store.value).toEqual({ a: 10, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
    });
    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(store.value).toEqual({ a: 1, b: 2 });
  });

  it('toState receives ctx.store', () => {
    const store = makeStore({ a: 1, b: 2 });
    let receivedStore: unknown;
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store, {
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        return data;
      },
    });
    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));
    expect(receivedStore).toBe(store);
  });

  it('replace mode: creates a new reference (Svelte reactivity)', () => {
    const store = makeStore({ a: 1, b: 2 });
    const originalRef = store.value;
    const applier = createSvelteSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store.value).not.toBe(originalRef);
    expect(store.value).toEqual({ a: 123 });
  });

  it('replace mode + pickKeys: only replaces picked keys, preserves others', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State>(store, {
      mode: 'replace',
      pickKeys: ['a'],
    });
    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(store.value).toEqual({ a: 100, b: 2 });
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(store.value).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(store.value).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: store unchanged', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(store.value).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, string>(store, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, string>(store, {
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
    const applier = createSvelteSnapshotApplier<State, { val: number }>(store, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedStore).toBe(store);
    expect(store.value).toEqual({ a: 42 });
  });

  it('replace mode with empty data: removes all allowed keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store.value).toEqual({});
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const initial: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const container = { value: { ...initial } };
    const store: SvelteStoreLike<DeepState> & { value: DeepState } = {
      get value() {
        return container.value;
      },
      set(v: DeepState) {
        container.value = v;
      },
      update(fn: (current: DeepState) => DeepState) {
        container.value = fn(container.value);
      },
    };
    const applier = createSvelteSnapshotApplier<DeepState, Partial<DeepState>>(store);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(store.value.config).toEqual({ theme: 'light', lang: 'fr' });
    expect(store.value.count).toBe(0);
  });

  it('each patch apply creates a new reference', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createSvelteSnapshotApplier<State, Partial<State>>(store);

    const ref1 = store.value;
    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    const ref2 = store.value;
    applier.apply(snapshot<Partial<State>>({ a: 20 }, '2'));
    const ref3 = store.value;

    expect(ref1).not.toBe(ref2);
    expect(ref2).not.toBe(ref3);
  });
});
