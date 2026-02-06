[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SyncErrorContext

# Interface: SyncErrorContext

Defined in: [types.ts:75](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L75)

## Properties

### attempt?

```ts
optional attempt: number;
```

Defined in: [types.ts:91](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L91)

***

### error

```ts
error: unknown;
```

Defined in: [types.ts:78](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L78)

***

### eventRevision?

```ts
optional eventRevision: Revision;
```

Defined in: [types.ts:88](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L88)

***

### localRevision?

```ts
optional localRevision: Revision;
```

Defined in: [types.ts:87](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L87)

Helpful context for triage/metrics. These fields are optional and best-effort.

***

### nextDelayMs?

```ts
optional nextDelayMs: number;
```

Defined in: [types.ts:93](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L93)

***

### phase

```ts
phase: SyncPhase;
```

Defined in: [types.ts:76](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L76)

***

### snapshotRevision?

```ts
optional snapshotRevision: Revision;
```

Defined in: [types.ts:89](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L89)

***

### sourceEvent?

```ts
optional sourceEvent: unknown;
```

Defined in: [types.ts:83](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L83)

Raw event payload when applicable (transport-specific).
Intentionally `unknown` to keep core transport-agnostic.

***

### sourceId?

```ts
optional sourceId: string;
```

Defined in: [types.ts:90](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L90)

***

### topic?

```ts
optional topic: string;
```

Defined in: [types.ts:77](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L77)

***

### willRetry?

```ts
optional willRetry: boolean;
```

Defined in: [types.ts:92](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L92)
