import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it, vi } from 'vitest';
import { createMobXSnapshotApplier, type MobXStoreLike } from '../src/mobx';

type State = { a: number; b?: number };

function makeStore(initial: State): MobXStoreLike<State> {
  return { ...initial };
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/mobx: createMobXSnapshotApplier', () => {
  it('patch mode (default): assigns keys directly on store', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(store).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: replaces all allowed keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(store).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(store).toEqual({ a: 123 });
    expect('b' in store).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(store).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State>(store, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(store).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, { a: number; meta: string }>(store, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(store).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(store).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
    });
    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(store).toEqual({ a: 1, b: 2 });
  });

  it('toState receives ctx.store', () => {
    const store = makeStore({ a: 1, b: 2 });
    let receivedStore: unknown;
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store, {
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
    const applier = createMobXSnapshotApplier<State>(store, {
      mode: 'replace',
      pickKeys: ['a'],
    });
    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(store).toEqual({ a: 100, b: 2 });
  });

  it('store reference remains the same after apply', () => {
    const store = makeStore({ a: 1, b: 2 });
    const originalRef = store;

    const applierPatch = createMobXSnapshotApplier<State, Partial<State>>(store);
    applierPatch.apply(snapshot<Partial<State>>({ a: 99 }, '1'));
    expect(store).toBe(originalRef);

    const applierReplace = createMobXSnapshotApplier<State>(store, { mode: 'replace' });
    applierReplace.apply(snapshot<State>({ a: 42 }, '2'));
    expect(store).toBe(originalRef);
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(store).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(store).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: store unchanged', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(store).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, string>(store, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, string>(store, {
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
    const applier = createMobXSnapshotApplier<State, { val: number }>(store, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedStore = ctx.store;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedStore).toBe(store);
    expect(store).toEqual({ a: 42 });
  });

  it('replace mode with empty data: removes all allowed keys', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store).toEqual({});
    expect('a' in store).toBe(false);
    expect('b' in store).toBe(false);
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const store: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const applier = createMobXSnapshotApplier<DeepState, Partial<DeepState>>(store);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(store.config).toEqual({ theme: 'light', lang: 'fr' });
    expect(store.count).toBe(0);
  });

  it('store reference stays the same even after empty replace', () => {
    const store = makeStore({ a: 1, b: 2 });
    const originalRef = store;
    const applier = createMobXSnapshotApplier<State>(store, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(store).toBe(originalRef);
  });

  // MobX-specific tests

  it('runInAction wraps all mutations in a single call', () => {
    const store = makeStore({ a: 1, b: 2 });
    const mockRunInAction = vi.fn((fn: () => void) => fn());
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store, {
      runInAction: mockRunInAction,
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 20 }, '1'));

    expect(mockRunInAction).toHaveBeenCalledTimes(1);
    expect(store).toEqual({ a: 10, b: 20 });
  });

  it('runInAction is called in replace mode too', () => {
    const store = makeStore({ a: 1, b: 2 });
    const mockRunInAction = vi.fn((fn: () => void) => fn());
    const applier = createMobXSnapshotApplier<State>(store, {
      mode: 'replace',
      runInAction: mockRunInAction,
    });

    applier.apply(snapshot<State>({ a: 99 }, '1'));

    expect(mockRunInAction).toHaveBeenCalledTimes(1);
    expect(store).toEqual({ a: 99 });
  });

  it('without runInAction: mutations still work (passthrough)', () => {
    const store = makeStore({ a: 1, b: 2 });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store);

    applier.apply(snapshot<Partial<State>>({ a: 42 }, '1'));

    expect(store).toEqual({ a: 42, b: 2 });
  });

  it('strict validation runs before runInAction', () => {
    const store = makeStore({ a: 1, b: 2 });
    const mockRunInAction = vi.fn((fn: () => void) => fn());
    const applier = createMobXSnapshotApplier<State, string>(store, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      runInAction: mockRunInAction,
    });

    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(mockRunInAction).not.toHaveBeenCalled();
  });

  it('runInAction receives a function that performs all mutations atomically', () => {
    const store = makeStore({ a: 1, b: 2 });
    let storeStateInsideFn: Record<string, unknown> | undefined;
    const mockRunInAction = vi.fn((fn: () => void) => {
      fn();
      storeStateInsideFn = { ...store };
    });
    const applier = createMobXSnapshotApplier<State, Partial<State>>(store, {
      runInAction: mockRunInAction,
    });

    applier.apply(snapshot<Partial<State>>({ a: 99 }, '1'));

    expect(storeStateInsideFn).toEqual({ a: 99, b: 2 });
  });
});
