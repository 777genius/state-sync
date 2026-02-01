[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SyncErrorContext

# Interface: SyncErrorContext

Defined in: [types.ts:74](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L74)

## Properties

### attempt?

```ts
optional attempt: number;
```

Defined in: [types.ts:90](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L90)

***

### error

```ts
error: unknown;
```

Defined in: [types.ts:77](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L77)

***

### eventRevision?

```ts
optional eventRevision: Revision;
```

Defined in: [types.ts:87](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L87)

***

### localRevision?

```ts
optional localRevision: Revision;
```

Defined in: [types.ts:86](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L86)

Helpful context for triage/metrics. These fields are optional and best-effort.

***

### nextDelayMs?

```ts
optional nextDelayMs: number;
```

Defined in: [types.ts:92](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L92)

***

### phase

```ts
phase: SyncPhase;
```

Defined in: [types.ts:75](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L75)

***

### snapshotRevision?

```ts
optional snapshotRevision: Revision;
```

Defined in: [types.ts:88](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L88)

***

### sourceEvent?

```ts
optional sourceEvent: unknown;
```

Defined in: [types.ts:82](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L82)

Raw event payload when applicable (transport-specific).
Intentionally `unknown` to keep core transport-agnostic.

***

### sourceId?

```ts
optional sourceId: string;
```

Defined in: [types.ts:89](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L89)

***

### topic?

```ts
optional topic: string;
```

Defined in: [types.ts:76](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L76)

***

### willRetry?

```ts
optional willRetry: boolean;
```

Defined in: [types.ts:91](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L91)
