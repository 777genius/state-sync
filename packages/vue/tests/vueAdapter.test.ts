import type { Revision, SnapshotEnvelope } from '@statesync/core';
import { describe, expect, it } from 'vitest';
import { createVueSnapshotApplier, type VueRefLike } from '../src/vue';

type State = { a: number; b?: number };

function makeReactive(initial: State): State {
  return { ...initial };
}

function makeRef(initial: State): VueRefLike<State> {
  return { value: { ...initial } };
}

function snapshot<T>(data: T, revision: string): SnapshotEnvelope<T> {
  return { data, revision: revision as Revision };
}

describe('@statesync/vue: createVueSnapshotApplier', () => {
  // -------------------------------------------------------------------------
  // reactive target
  // -------------------------------------------------------------------------

  it('reactive + patch mode (default): assigns keys on reactive object', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(state);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(state).toEqual({ a: 10, b: 2 });
  });

  it('reactive + replace mode: replaces state, removes stale keys', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(state, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 0 }, '2'));

    expect(state).toEqual({ a: 0 });
    expect('b' in state).toBe(false);
  });

  it('reactive + replace mode: reactive reference stays the same', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const ref = state;
    const applier = createVueSnapshotApplier<State>(state, { mode: 'replace' });

    applier.apply(snapshot<State>({ a: 42 }, '3'));

    expect(state).toBe(ref);
    expect(state).toEqual({ a: 42 });
  });

  it('reactive + pickKeys: limits which keys are updated', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(state, {
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(state).toEqual({ a: 10, b: 2 });
  });

  it('reactive + omitKeys in replace mode: preserves omitted keys', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(state, {
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(state).toEqual({ a: 10, b: 2 });
  });

  // -------------------------------------------------------------------------
  // ref target
  // -------------------------------------------------------------------------

  it('ref + patch mode: merges via ref.value spread', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, {
      target: 'ref',
    });

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(ref.value).toEqual({ a: 10, b: 2 });
  });

  it('ref + replace mode: replaces ref.value', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(ref, {
      target: 'ref',
      mode: 'replace',
    });

    applier.apply(snapshot<State>({ a: 42 }, '2'));

    expect(ref.value).toEqual({ a: 42 });
  });

  it('ref + replace mode: removes stale keys', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(ref, {
      target: 'ref',
      mode: 'replace',
    });

    applier.apply(snapshot<State>({ a: 123 }, '3'));

    expect(ref.value).toEqual({ a: 123 });
    expect('b' in ref.value).toBe(false);
  });

  // -------------------------------------------------------------------------
  // toState mapping
  // -------------------------------------------------------------------------

  it('supports toState mapping (reactive)', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, { a: number; meta: string }>(state, {
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(state).toEqual({ a: 7, b: 2 });
  });

  it('supports toState mapping (ref)', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, { a: number; meta: string }>(ref, {
      target: 'ref',
      toState: (data) => ({ a: data.a }),
    });

    applier.apply(snapshot({ a: 7, meta: 'x' }, '3'));

    expect(ref.value).toEqual({ a: 7, b: 2 });
  });

  // -------------------------------------------------------------------------
  // strict mode
  // -------------------------------------------------------------------------

  it('strict=false: ignores invalid toState result', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(state, {
      toState: () => 'not-an-object' as unknown as Partial<State>,
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(state).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(state, {
      toState: () => 'not-an-object' as unknown as Partial<State>,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(state).toEqual({ a: 1, b: 2 });
  });

  it('strict=true (default): throws on non-object toState result (ref)', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(ref, {
      target: 'ref',
      toState: () => 'not-an-object' as unknown as Partial<State>,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).toThrow(
      'toState(data) must return a plain object',
    );
    expect(ref.value).toEqual({ a: 1, b: 2 });
  });

  it('strict=false: ignores invalid toState result (ref)', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(ref, {
      target: 'ref',
      toState: () => 'not-an-object' as unknown as Partial<State>,
      strict: false,
    });

    expect(() => applier.apply(snapshot('anything', '4'))).not.toThrow();
    expect(ref.value).toEqual({ a: 1, b: 2 });
  });

  // -------------------------------------------------------------------------
  // reactive identity preservation
  // -------------------------------------------------------------------------

  it('reactive + patch mode: reactive reference stays the same', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const ref = state;
    const applier = createVueSnapshotApplier<State, Partial<State>>(state);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(state).toBe(ref);
  });

  // -------------------------------------------------------------------------
  // toState context
  // -------------------------------------------------------------------------

  it('toState receives ctx.state for reactive target', () => {
    const state = makeReactive({ a: 1, b: 2 });
    let receivedState: unknown;
    const applier = createVueSnapshotApplier<State, Partial<State>>(state, {
      toState: (data, ctx) => {
        receivedState = ctx.state;
        return data;
      },
    });

    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));

    expect(receivedState).toBe(state);
  });

  it('toState receives ctx.ref for ref target', () => {
    const ref = makeRef({ a: 1, b: 2 });
    let receivedRef: unknown;
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, {
      target: 'ref',
      toState: (data, ctx) => {
        receivedRef = ctx.ref;
        return data;
      },
    });

    applier.apply(snapshot<Partial<State>>({ a: 5 }, '1'));

    expect(receivedRef).toBe(ref);
  });

  // -------------------------------------------------------------------------
  // replace mode + pickKeys
  // -------------------------------------------------------------------------

  it('reactive + replace mode + pickKeys: only replaces picked keys', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(state, {
      mode: 'replace',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<State>({ a: 99 }, '1'));

    expect(state).toEqual({ a: 99, b: 2 });
  });

  it('ref + replace mode + pickKeys: only replaces picked keys, preserves others', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(ref, {
      target: 'ref',
      mode: 'replace',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<State>({ a: 99 }, '1'));

    expect(ref.value).toEqual({ a: 99, b: 2 });
  });

  it('ref + omitKeys in replace mode: preserves omitted keys', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(ref, {
      target: 'ref',
      mode: 'replace',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<State>({ a: 10 }, '1'));

    expect(ref.value).toEqual({ a: 10, b: 2 });
  });

  it('ref + pickKeys in patch mode: limits which keys are updated', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, {
      target: 'ref',
      mode: 'patch',
      pickKeys: ['a'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(ref.value).toEqual({ a: 10, b: 2 });
  });

  it('reactive + omitKeys in patch mode: skips omitted keys', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(state, {
      mode: 'patch',
      omitKeys: ['b'],
    });

    applier.apply(snapshot<Partial<State>>({ a: 10, b: 999 }, '1'));

    expect(state).toEqual({ a: 10, b: 2 });
  });

  // -------------------------------------------------------------------------
  // Edge-case: multiple sequential applies
  // -------------------------------------------------------------------------

  it('reactive: multiple sequential applies accumulate correctly', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(state);

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(state).toEqual({ a: 100, b: 20 });
  });

  it('ref: multiple sequential applies accumulate correctly', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, { target: 'ref' });

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));
    applier.apply(snapshot<Partial<State>>({ b: 20 }, '2'));
    applier.apply(snapshot<Partial<State>>({ a: 100 }, '3'));

    expect(ref.value).toEqual({ a: 100, b: 20 });
  });

  // -------------------------------------------------------------------------
  // Edge-case: empty snapshot data
  // -------------------------------------------------------------------------

  it('reactive: empty snapshot data in patch mode leaves state unchanged', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(state);

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(state).toEqual({ a: 1, b: 2 });
  });

  it('ref: empty snapshot data in patch mode leaves ref.value unchanged', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, { target: 'ref' });

    applier.apply(snapshot<Partial<State>>({}, '1'));

    expect(ref.value).toEqual({ a: 1, b: 2 });
  });

  // -------------------------------------------------------------------------
  // Edge-case: strict rejects non-plain-object values
  // -------------------------------------------------------------------------

  it('reactive: strict rejects array from toState', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(state, {
      toState: () => [1, 2, 3] as unknown as Partial<State>,
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  it('reactive: strict rejects null from toState', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State, string>(state, {
      toState: () => null as unknown as Partial<State>,
    });
    expect(() => applier.apply(snapshot('x', '1'))).toThrow(
      'toState(data) must return a plain object',
    );
  });

  // -------------------------------------------------------------------------
  // Edge-case: replace mode with empty data
  // -------------------------------------------------------------------------

  it('reactive: replace mode with empty data removes all allowed keys', () => {
    const state = makeReactive({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(state, { mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(state).toEqual({});
  });

  it('ref: replace mode with empty data removes all allowed keys', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const applier = createVueSnapshotApplier<State>(ref, { target: 'ref', mode: 'replace' });

    applier.apply(snapshot<State>({} as State, '1'));

    expect(ref.value).toEqual({});
  });

  // -------------------------------------------------------------------------
  // Edge-case: nested objects (shallow/top-level only)
  // -------------------------------------------------------------------------

  it('reactive: nested objects are replaced, not deep-merged', () => {
    type DeepState = { config: { theme: string; lang: string }; count: number };
    const state: DeepState = { config: { theme: 'dark', lang: 'en' }, count: 0 };
    const applier = createVueSnapshotApplier<DeepState, Partial<DeepState>>(state);

    applier.apply(snapshot<Partial<DeepState>>({ config: { theme: 'light', lang: 'fr' } }, '1'));

    expect(state.config).toEqual({ theme: 'light', lang: 'fr' });
    expect(state.count).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Edge-case: ref container identity
  // -------------------------------------------------------------------------

  it('ref: container object stays the same, only .value changes', () => {
    const ref = makeRef({ a: 1, b: 2 });
    const containerRef = ref;
    const applier = createVueSnapshotApplier<State, Partial<State>>(ref, { target: 'ref' });

    applier.apply(snapshot<Partial<State>>({ a: 10 }, '1'));

    expect(ref).toBe(containerRef);
    expect(ref.value).toEqual({ a: 10, b: 2 });
  });

  // -------------------------------------------------------------------------
  // Edge-case: toState in replace mode receives context
  // -------------------------------------------------------------------------

  it('reactive: toState in replace mode receives ctx.state', () => {
    const state = makeReactive({ a: 1, b: 2 });
    let receivedState: unknown;
    const applier = createVueSnapshotApplier<State, { val: number }>(state, {
      mode: 'replace',
      toState: (data, ctx) => {
        receivedState = ctx.state;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedState).toBe(state);
    expect(state).toEqual({ a: 42 });
  });

  it('ref: toState in replace mode receives ctx.ref', () => {
    const ref = makeRef({ a: 1, b: 2 });
    let receivedRef: unknown;
    const applier = createVueSnapshotApplier<State, { val: number }>(ref, {
      target: 'ref',
      mode: 'replace',
      toState: (data, ctx) => {
        receivedRef = ctx.ref;
        return { a: data.val };
      },
    });
    applier.apply(snapshot({ val: 42 }, '1'));
    expect(receivedRef).toBe(ref);
    expect(ref.value).toEqual({ a: 42 });
  });
});
