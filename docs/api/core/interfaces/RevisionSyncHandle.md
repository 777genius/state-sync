[**state-sync**](../index.md)

***

[state-sync](../index.md) / RevisionSyncHandle

# Interface: RevisionSyncHandle

Defined in: [engine.ts:25](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L25)

## Methods

### getLocalRevision()

```ts
getLocalRevision(): Revision;
```

Defined in: [engine.ts:29](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L29)

#### Returns

[`Revision`](../type-aliases/Revision.md)

***

### refresh()

```ts
refresh(): Promise<void>;
```

Defined in: [engine.ts:28](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L28)

#### Returns

`Promise`\<`void`\>

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [engine.ts:26](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L26)

#### Returns

`Promise`\<`void`\>

***

### stop()

```ts
stop(): void;
```

Defined in: [engine.ts:27](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/engine.ts#L27)

#### Returns

`void`
