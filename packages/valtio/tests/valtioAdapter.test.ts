import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import { createValtioSnapshotApplier, type ValtioProxyLike } from '../src/valtio';

type State = { a: number; b?: number };

function makeProxy(initial: State): ValtioProxyLike<State> {
  return { ...initial };
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/valtio: createValtioSnapshotApplier', () => {
  it('patch mode (default): assigns keys directly on proxy', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(proxy).toEqual({ a: 10, b: 2 });
  });

  it('replace mode: replaces all allowed keys', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State>(proxy, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(proxy).toEqual({ a: 0 });
  });

  it('replace mode: removes stale top-level keys', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State>(proxy, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 123 }, '2'));

    expect(proxy).toEqual({ a: 123 });
    expect('b' in proxy).toBe(false);
  });

  it('pickKeys limits which keys can be updated', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(proxy).toEqual({ a: 10, b: 2 });
  });

  it('omitKeys prevents keys from being updated or deleted in replace mode', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State>(proxy, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(proxy).toEqual({ a: 10, b: 2 });
  });

  it('supports toState mapping', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, { a: number; meta: string }>(proxy, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(proxy).toEqual({ a: 7, b: 2 });
  });

  it('strict=false: ignores invalid toState result', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, string>(proxy, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(proxy).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, string>(proxy, {
      // @ts-expect-error - intentionally wrong to test runtime behavior
      toState: () => 'not-an-object',
    });
    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(proxy).toEqual({ a: 1, b: 2 });
  });

  it('toState receives ctx.proxy', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    let receivedProxy: unknown;
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy, {
      toState: (data, ctx) => {
        receivedProxy = ctx.proxy;
        return data;
      },
    });
    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));
    expect(receivedProxy).toBe(proxy);
  });

  it('replace mode + pickKeys: only replaces picked keys, preserves others', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State>(proxy, {
      mode: 'replace',
      pickKeys: ['a'],
    });
    applier.apply(snapshot<State>({ a: 100 }, '1'));
    expect(proxy).toEqual({ a: 100, b: 2 });
  });

  it('proxy reference remains the same after apply', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const originalRef = proxy;

    const applierPatch = createValtioSnapshotApplier<State, Partial<State>>(proxy);
    applierPatch.apply(snapshot<Partial<State>>({ a: 99 }, '1'));
    expect(proxy).toBe(originalRef);

    const applierReplace = createValtioSnapshotApplier<State>(proxy, { mode: 'replace' });
    applierReplace.apply(snapshot<State>({ a: 42 }, '2'));
    expect(proxy).toBe(originalRef);
  });

  it('omitKeys in patch mode: skips omitted keys', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy, {
      mode: 'patch',
      omitKeys: ['b'],
    });
    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));
    expect(proxy).toEqual({ a: 10, b: 2 });
  });

  it('multiple sequential applies accumulate correctly', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(proxy).toEqual({ a: 100, b: 20 });
  });

  it('empty snapshot data in patch mode: proxy unchanged', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, Partial<State>>(proxy);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(proxy).toEqual({ a: 1, b: 2 });
  });

  it('strict rejects array from toState', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, string>(proxy, {
      // @ts-expect-error - testing runtime validation
      toState: () => [1, 2, 3],
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('strict rejects null from toState', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State, string>(proxy, {
      // @ts-expect-error - testing runtime validation
      toState: () => null,
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('toState in replace mode receives ctx.proxy', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    let receivedProxy: unknown;
    const applier = createValtioSnapshotApplier<State, { val: number }>(proxy, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedProxy = ctx.proxy;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedProxy).toBe(proxy);
    expect(proxy).toEqual({ a: 42 });
  });

  it('replace mode with empty data: removes all allowed keys', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const applier = createValtioSnapshotApplier<State>(proxy, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(proxy).toEqual({});
    expect('a' in proxy).toBe(false);
    expect('b' in proxy).toBe(false);
  });

  it('nested objects: only top-level keys are patched (no deep merge)', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const proxy: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const applier = createValtioSnapshotApplier<DeepState, Partial<DeepState>>(proxy);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(proxy.config).toEqual({ theme: 'light', lang: 'fr' });
    expect(proxy.count).toBe(0);
  });

  it('proxy reference stays the same even after empty replace', () => {
    const proxy = makeProxy({ a: 1, b: 2 });
    const originalRef = proxy;
    const applier = createValtioSnapshotApplier<State>(proxy, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(proxy).toBe(originalRef);
  });
});
