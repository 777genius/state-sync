[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / SaveThrottlingOptions

# Interface: SaveThrottlingOptions

Defined in: [persistence/src/types.ts:314](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L314)

Options for controlling save frequency.

## Properties

### debounceMs?

```ts
optional debounceMs: number;
```

Defined in: [persistence/src/types.ts:319](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L319)

Debounce delay in ms. Waits for "silence" before saving.
Use for high-frequency updates where only final state matters.

***

### leading?

```ts
optional leading: boolean;
```

Defined in: [persistence/src/types.ts:331](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L331)

If true, save immediately on first update (before debounce/throttle).
Default: false (for persistence, we want to wait for debounce)

***

### maxWaitMs?

```ts
optional maxWaitMs: number;
```

Defined in: [persistence/src/types.ts:337](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L337)

Maximum time to wait before forcing a save (ms).
Prevents indefinite delay during continuous updates.

***

### throttleMs?

```ts
optional throttleMs: number;
```

Defined in: [persistence/src/types.ts:325](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L325)

Throttle interval in ms. Maximum one save per interval.
Use when you want periodic saves during continuous updates.
