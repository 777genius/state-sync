[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceErrorContext

# Interface: PersistenceErrorContext

Defined in: [persistence/src/types.ts:300](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L300)

Context provided to error handlers.

## Properties

### error

```ts
error: unknown;
```

Defined in: [persistence/src/types.ts:302](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L302)

***

### metadata?

```ts
optional metadata: PersistedSnapshotMetadata;
```

Defined in: [persistence/src/types.ts:304](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L304)

***

### operation

```ts
operation: "save" | "load" | "clear" | "migrate";
```

Defined in: [persistence/src/types.ts:301](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L301)

***

### snapshot?

```ts
optional snapshot: SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/types.ts:303](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L303)
