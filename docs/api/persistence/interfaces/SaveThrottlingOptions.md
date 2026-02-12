[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / SaveThrottlingOptions

# Interface: SaveThrottlingOptions

Defined in: [persistence/src/types.ts:575](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L575)

Options for controlling how frequently snapshots are saved to storage.

Supports debouncing, throttling, leading-edge saves, and a maximum wait cap.
These options help balance write frequency against data freshness, especially
during rapid or continuous state updates.

## Example

```typescript
const throttling: SaveThrottlingOptions = {
  debounceMs: 300,    // Wait 300ms of silence before saving
  maxWaitMs: 2000,    // But never wait more than 2s total
};
```

## Properties

### debounceMs?

```ts
optional debounceMs: number;
```

Defined in: [persistence/src/types.ts:583](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L583)

Debounce delay in milliseconds. The save is postponed until no new
snapshots arrive for this duration ("wait for silence").

Best for high-frequency updates where only the final state matters
(e.g., text input, slider dragging).

***

### leading?

```ts
optional leading: boolean;
```

Defined in: [persistence/src/types.ts:600](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L600)

If `true`, the very first update triggers an immediate save before
the debounce/throttle timer starts.

#### Default Value

`false`

***

### maxWaitMs?

```ts
optional maxWaitMs: number;
```

Defined in: [persistence/src/types.ts:609](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L609)

Maximum time in milliseconds to wait before forcing a save, even if
debounce keeps resetting. Prevents indefinite delay during continuous
updates.

Only meaningful when [debounceMs](#debouncems) is also set.

***

### throttleMs?

```ts
optional throttleMs: number;
```

Defined in: [persistence/src/types.ts:592](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L592)

Throttle interval in milliseconds. At most one save will occur per
interval, regardless of how many snapshots arrive.

Best when you want periodic saves during continuous updates
(e.g., real-time collaboration).
